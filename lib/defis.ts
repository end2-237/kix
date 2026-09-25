import "server-only";
import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import { challenges, db, matches, users, venues } from "@/db";

/**
 * Les défis entre joueurs.
 *
 * Une rencontre naissait uniquement du comptoir : deux joueurs devaient
 * trouver un gérant disponible pour que leur partie compte, alors que le jeton
 * est automatisé depuis longtemps. Le défi ferme cette boucle — on se voit au
 * classement, on se propose une salle, et le match existe.
 */

export type VueDefi = {
  defi: typeof challenges.$inferSelect;
  adversaire: { id: string; name: string; avatar: string | null; points: number };
  salle: { id: string; name: string; slug: string } | null;
  /** Vrai quand c'est à moi de répondre : l'autre a proposé le lieu en dernier. */
  aMoiDeRepondre: boolean;
};

const EN_COURS = ["propose"];

async function habiller(moi: string, lignes: (typeof challenges.$inferSelect)[]): Promise<VueDefi[]> {
  if (lignes.length === 0) return [];

  const gens = [...new Set(lignes.flatMap((d) => [d.fromId, d.toId]))];
  const lieux = [...new Set(lignes.map((d) => d.venueId).filter((v): v is string => Boolean(v)))];

  const [comptes, salles] = await Promise.all([
    db.select({ id: users.id, name: users.name, avatar: users.avatar, points: users.points }).from(users).where(inArray(users.id, gens)),
    lieux.length
      ? db.select({ id: venues.id, name: venues.name, slug: venues.slug }).from(venues).where(inArray(venues.id, lieux))
      : Promise.resolve([]),
  ]);

  const parId = new Map(comptes.map((c) => [c.id, c]));
  const parSalle = new Map(salles.map((v) => [v.id, v]));

  return lignes.map((defi) => {
    const autre = defi.fromId === moi ? defi.toId : defi.fromId;
    return {
      defi,
      adversaire: parId.get(autre) ?? { id: autre, name: "Joueur", avatar: null, points: 0 },
      salle: defi.venueId ? (parSalle.get(defi.venueId) ?? null) : null,
      // Celui qui a proposé le lieu en dernier attend la réponse de l'autre.
      aMoiDeRepondre: defi.status === "propose" && defi.lieuParId !== moi,
    };
  });
}

/** Tous mes défis, les vivants d'abord. */
export async function mesDefis(moi: string): Promise<VueDefi[]> {
  const lignes = await db
    .select()
    .from(challenges)
    .where(or(eq(challenges.fromId, moi), eq(challenges.toId, moi)))
    .orderBy(desc(challenges.updatedAt))
    .limit(40);
  return habiller(moi, lignes);
}

/** Le défi vivant entre deux joueurs, s'il y en a un. */
export async function defiEnCours(moi: string, autre: string) {
  return (
    await db
      .select()
      .from(challenges)
      .where(
        and(
          inArray(challenges.status, EN_COURS),
          or(
            and(eq(challenges.fromId, moi), eq(challenges.toId, autre)),
            and(eq(challenges.fromId, autre), eq(challenges.toId, moi)),
          ),
        ),
      )
      .limit(1)
  )[0];
}

/** Combien de défis attendent ma réponse — pour la pastille du profil. */
export async function defisAttendus(moi: string): Promise<number> {
  const lignes = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(
      and(
        eq(challenges.status, "propose"),
        or(eq(challenges.fromId, moi), eq(challenges.toId, moi)),
        ne(challenges.lieuParId, moi),
      ),
    );
  return lignes.length;
}

/** Les rencontres nées d'un défi, pour la page du joueur. */
export async function duelsJoues(moi: string, limite = 10) {
  return db
    .select({ defi: challenges, match: matches })
    .from(challenges)
    .innerJoin(matches, eq(matches.id, challenges.matchId))
    .where(and(eq(challenges.status, "accepte"), or(eq(challenges.fromId, moi), eq(challenges.toId, moi))))
    .orderBy(desc(challenges.updatedAt))
    .limit(limite);
}
