import "server-only";
import { eq } from "drizzle-orm";
import { db, notifications, users } from "@/db";
import { uid } from "@/lib/domain";

/**
 * Annoncer quelque chose à toute la salle.
 *
 * Une soirée, un tournoi : l'affiche existait, mais il fallait tomber dessus.
 * Personne n'ouvre une application de billard tous les jours pour vérifier si
 * un tournoi a été publié — c'est à l'annonce d'aller chercher le joueur, sur
 * son écran verrouillé s'il l'a permis, dans ses notifications sinon.
 *
 * Deux garde-fous, parce qu'une annonce de masse ne se rattrape pas :
 *
 *  · une seule fois par chose annoncée. Le lien sert de marque : s'il existe
 *    déjà une notification qui y mène, c'est que l'annonce est partie. Un
 *    gérant qui corrige l'horaire de sa soirée trois fois de suite ne réveille
 *    pas la ville trois fois.
 *  · les joueurs seulement. Les comptes de gérant, de vendeur et
 *    d'administration tiennent déjà leur console ; les prévenir d'une soirée
 *    qu'ils viennent de créer serait grotesque.
 */
export async function annoncerATous(annonce: {
  titre: string;
  corps: string;
  kind: string;
  href: string;
  /** L'auteur, qui n'a pas besoin d'être prévenu de ce qu'il vient de publier. */
  sauf?: string | null;
}): Promise<number> {
  const { titre, corps, kind, href, sauf } = annonce;
  if (!href) return 0;

  const deja = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.href, href)).limit(1);
  if (deja.length > 0) return 0;

  const joueurs = await db.select({ id: users.id }).from(users).where(eq(users.role, "client"));
  const cibles = joueurs.map((j) => j.id).filter((id) => id !== sauf);
  if (cibles.length === 0) return 0;

  // Une seule écriture pour tout le monde : mille insertions séparées
  // tiendraient la base occupée pendant que le gérant attend sa page.
  await db.insert(notifications).values(
    cibles.map((userId) => ({ id: uid(), userId, title: titre, body: corps, kind, href, read: false })),
  );

  // Le push part après l'écrit, sans le retarder : la notification existe déjà
  // en base, et un service de push lent ne doit pas faire attendre un
  // formulaire. Le service worker ira chercher le texte lui-même.
  void import("@/lib/push")
    .then((m) => m.pousser(cibles))
    .catch(() => {});

  return cibles.length;
}
