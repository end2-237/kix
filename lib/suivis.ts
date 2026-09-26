import "server-only";
import { and, count, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db, follows, streams, users, type Stream } from "@/db";
import { hydrate, type StreamCard } from "@/lib/stream";
import { notify, uid } from "@/lib/domain";

/**
 * Suivre un diffuseur.
 *
 * L'amitié est réciproque et se demande ; suivre ne demande rien et n'engage
 * que celui qui suit. C'est le geste qui transforme une caméra allumée au
 * hasard en rendez-vous : on apprend que son diffuseur ouvre, on vient.
 */

export type Diffuseur = {
  id: string;
  name: string;
  avatar: string | null;
  points: number;
  /** Directs ouverts par ce compte, toutes salles confondues. */
  directs: number;
  /** Une caméra allumée maintenant, et laquelle. */
  enDirect: { id: string; title: string } | null;
  abonnes: number;
};

/** Est-ce que je suis déjà ce compte ? */
export async function jeSuis(followerId: string, hostId: string): Promise<boolean> {
  const row = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.hostId, hostId)))
    .limit(1);
  return Boolean(row[0]);
}

/** Combien de personnes suivent ce diffuseur. */
export async function nombreDAbonnes(hostId: string): Promise<number> {
  const row = await db.select({ n: count() }).from(follows).where(eq(follows.hostId, hostId));
  return Number(row[0]?.n ?? 0);
}

/**
 * Ce compte diffuse-t-il ?
 *
 * Un seul direct ouvert un jour suffit : le bouton « Suivre » n'a de sens que
 * sur la fiche de quelqu'un qui filme, pas sur celle du joueur du dimanche.
 */
export async function estDiffuseur(userId: string): Promise<boolean> {
  const row = await db.select({ id: streams.id }).from(streams).where(eq(streams.createdBy, userId)).limit(1);
  return Boolean(row[0]);
}

/** Qui je suis — avec, pour chacun, sa caméra si elle est allumée. */
export async function mesDiffuseurs(followerId: string): Promise<Diffuseur[]> {
  const liens = await db
    .select({ hostId: follows.hostId })
    .from(follows)
    .where(eq(follows.followerId, followerId))
    .orderBy(desc(follows.createdAt));
  const ids = liens.map((l) => l.hostId);
  if (ids.length === 0) return [];

  const [gens, directs, publics] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, avatar: users.avatar, points: users.points })
      .from(users)
      .where(inArray(users.id, ids)),
    db
      .select({ id: streams.id, title: streams.title, status: streams.status, createdBy: streams.createdBy })
      .from(streams)
      .where(inArray(streams.createdBy, ids)),
    db
      .select({ hostId: follows.hostId, n: count() })
      .from(follows)
      .where(inArray(follows.hostId, ids))
      .groupBy(follows.hostId),
  ]);

  // L'ordre des liens est celui de l'abonnement, du plus récent au plus
  // ancien ; on le garde plutôt que celui, arbitraire, du `in`.
  return ids.flatMap((id) => {
    const qui = gens.find((g) => g.id === id);
    if (!qui) return [];
    const siens = directs.filter((d) => d.createdBy === id);
    const ouvert = siens.find((d) => d.status === "live");
    return [
      {
        ...qui,
        directs: siens.length,
        enDirect: ouvert ? { id: ouvert.id, title: ouvert.title } : null,
        abonnes: Number(publics.find((p) => p.hostId === id)?.n ?? 0),
      },
    ];
  });
}

/**
 * Les directs de mes diffuseurs, les caméras allumées d'abord.
 *
 * C'est le rayon qui justifie de suivre quelqu'un : il passe devant la
 * vitrine générale, parce qu'on l'a choisi.
 */
export async function directsDeMesDiffuseurs(followerId: string, limite = 12): Promise<StreamCard[]> {
  const liens = await db.select({ hostId: follows.hostId }).from(follows).where(eq(follows.followerId, followerId));
  const ids = liens.map((l) => l.hostId);
  if (ids.length === 0) return [];

  const rows = await db
    .select()
    .from(streams)
    .where(and(inArray(streams.createdBy, ids), ne(streams.status, "idle")))
    .orderBy(sql`case when ${streams.status} = 'live' then 0 else 1 end`, desc(streams.updatedAt))
    .limit(limite);

  return hydrate(rows);
}

/**
 * La caméra s'allume : prévenir ceux qui suivent.
 *
 * Une seule écriture pour tout le monde, et le push après — un direct qui
 * démarre ne doit pas attendre le serveur de notifications pour apparaître.
 * Le diffuseur lui-même n'est pas prévenu de sa propre caméra.
 */
export async function prevenirLesAbonnes(stream: Pick<Stream, "id" | "title" | "createdBy">): Promise<number> {
  if (!stream.createdBy) return 0;

  const [qui, abonnes] = await Promise.all([
    db.select({ name: users.name }).from(users).where(eq(users.id, stream.createdBy)).limit(1),
    db.select({ id: follows.followerId }).from(follows).where(eq(follows.hostId, stream.createdBy)),
  ]);
  const cibles = abonnes.map((a) => a.id).filter((id) => id !== stream.createdBy);
  if (cibles.length === 0) return 0;

  const nom = qui[0]?.name ?? "Un diffuseur";
  const href = `/direct/${stream.id}`;

  const { notifications } = await import("@/db");
  await db.insert(notifications).values(
    cibles.map((userId) => ({
      id: uid(),
      userId,
      title: `${nom} est en direct`,
      body: stream.title,
      kind: "system",
      href,
      read: false,
    })),
  );

  void import("@/lib/push")
    .then((m) => m.pousser(cibles))
    .catch(() => {});

  return cibles.length;
}

/** Prévenir le diffuseur qu'il a un abonné de plus — c'est ce qui donne envie de recommencer. */
export async function prevenirLeDiffuseur(hostId: string, nomDuSuiveur: string, total: number) {
  await notify(
    hostId,
    "Un abonné de plus",
    `${nomDuSuiveur} suit tes directs — ${total} abonné${total > 1 ? "s" : ""} au total.`,
    "system",
    "/app/diffuser",
  );
}

export type Hote = {
  id: string;
  name: string;
  avatar: string | null;
  abonnes: number;
  directs: number;
  suivi: boolean;
  cestMoi: boolean;
};

/**
 * La ligne du diffuseur sur la page d'un direct.
 *
 * Elle ne s'affiche que pour un compte de joueur : un direct tenu par la
 * salle n'a personne à suivre, et un bouton « Suivre » sous le nom d'un
 * gérant ne promettrait rien.
 */
export async function hoteDuDirect(createdBy: string | null, moi: string): Promise<Hote | null> {
  if (!createdBy) return null;

  const qui = (
    await db
      .select({ id: users.id, name: users.name, avatar: users.avatar, role: users.role })
      .from(users)
      .where(eq(users.id, createdBy))
      .limit(1)
  )[0];
  if (!qui || qui.role !== "client") return null;

  const [abonnes, directs, suivi] = await Promise.all([
    nombreDAbonnes(qui.id),
    db.select({ n: count() }).from(streams).where(eq(streams.createdBy, qui.id)),
    qui.id === moi ? Promise.resolve(false) : jeSuis(moi, qui.id),
  ]);

  return {
    id: qui.id,
    name: qui.name,
    avatar: qui.avatar,
    abonnes,
    directs: Number(directs[0]?.n ?? 0),
    suivi,
    cestMoi: qui.id === moi,
  };
}

/** Combien de diffuseurs je suis — de quoi décider si le raccourci a lieu d'être. */
export async function nombreDeSuivis(followerId: string): Promise<number> {
  const row = await db.select({ n: count() }).from(follows).where(eq(follows.followerId, followerId));
  return Number(row[0]?.n ?? 0);
}
