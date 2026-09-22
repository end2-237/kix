/**
 * Le moteur d'un tournoi : tirage, montée des vainqueurs, clôture.
 *
 * Il ne connaît pas `@/db` — il reçoit sa base en argument. C'est ce qui
 * permet au jeu de démonstration, qui tourne dans Node et non dans le
 * serveur, de dérouler un vrai tableau au lieu d'en recopier un à la main :
 * ce que la démonstration montre est alors exactement ce que l'application
 * produit.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { tournaments, tournamentMatches, tournamentPlayers, users } from "@/db/schema";
import type { Db } from "@/db/client";
import {
  courseDuTour,
  duelSuivant,
  nombreDeTours,
  plateauComplet,
  pointsDeClassement,
  taillePlateau,
} from "@/lib/bracket";

const uid = () => crypto.randomUUID();

export function getBracket(db: Db, tournamentId: string) {
  return db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(asc(tournamentMatches.round), asc(tournamentMatches.slot));
}

/**
 * Le tirage au sort du tableau.
 *
 * Les têtes de série suivent les points de classement : c'est la seule mesure
 * objective dont on dispose, et elle récompense ceux qui jouent. À égalité,
 * l'ancienneté de la candidature départage — arriver tôt vaut mieux que tard.
 *
 * Le tableau entier est créé d'un coup, tours vides compris : on voit dès
 * l'ouverture où mène chaque victoire.
 */
export async function tirerLeTableau(db: Db, tournamentId: string): Promise<{ ok: true; duels: number } | { ok: false; error: string }> {
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1))[0];
  if (!t) return { ok: false, error: "Tournoi introuvable." };
  if (t.status === "encours" || t.status === "termine") {
    return { ok: false, error: "Le tableau est déjà tiré." };
  }

  const tous = await db
    .select({ player: tournamentPlayers, points: users.points })
    .from(tournamentPlayers)
    .innerJoin(users, eq(users.id, tournamentPlayers.userId))
    .where(and(eq(tournamentPlayers.tournamentId, tournamentId), eq(tournamentPlayers.status, "accepte")))
    .orderBy(desc(users.points), asc(tournamentPlayers.createdAt));

  // Un droit d'inscription impayé ne prend pas de place au tableau : le tirage
  // se fait une fois, et un tableau qu'on refait fait perdre la salle.
  const inscrits = tous.filter((r) => r.player.fee === 0 || r.player.payment === "paye");
  if (inscrits.length < 2) {
    return {
      ok: false,
      error:
        tous.length >= 2
          ? "Moins de deux inscriptions sont réglées. Relance les joueurs ou passe leur droit à zéro."
          : "Il faut au moins deux joueurs acceptés.",
    };
  }

  const classes = inscrits.map((r) => r.player.id);
  const tours = nombreDeTours(classes.length);

  // Le rang de tête de série est écrit sur la candidature : il sert ensuite à
  // l'affichage, et on ne veut pas le recalculer à chaque rendu.
  await Promise.all(
    classes.map((id, i) =>
      db.update(tournamentPlayers).set({ seed: i + 1 }).where(eq(tournamentPlayers.id, id)),
    ),
  );

  await db.delete(tournamentMatches).where(eq(tournamentMatches.tournamentId, tournamentId));

  const duels = plateauComplet(classes);
  await db.insert(tournamentMatches).values(
    duels.map((d) => ({
      id: uid(),
      tournamentId,
      round: d.round,
      slot: d.slot,
      playerAId: d.a?.playerId ?? null,
      playerBId: d.b?.playerId ?? null,
      raceTo: courseDuTour(d.round, tours, t.raceTo),
      status: "attente" as const,
    })),
  );

  await db
    .update(tournaments)
    .set({ status: "encours", size: taillePlateau(classes.length) })
    .where(eq(tournaments.id, tournamentId));

  // Les exemptions se résolvent tout de suite : un joueur seul face à personne
  // a gagné, et son adversaire du tour suivant doit pouvoir l'apprendre.
  await resoudreExemptions(db, tournamentId);

  return { ok: true, duels: duels.length };
}

/** Un duel sans adversaire est gagné d'office : on le propage. */
async function resoudreExemptions(db: Db, tournamentId: string) {
  const duels = await getBracket(db, tournamentId);

  for (const d of duels) {
    if (d.status !== "attente" || d.round !== 1) continue;
    const seul = d.playerAId && !d.playerBId ? d.playerAId : !d.playerAId && d.playerBId ? d.playerBId : null;
    if (!seul) continue;

    await db
      .update(tournamentMatches)
      .set({ winnerId: seul, status: "exempt" })
      .where(eq(tournamentMatches.id, d.id));
    await faireMonter(db, tournamentId, d.round, d.slot, seul);
  }
}

/** Inscrire un vainqueur à sa place du tour suivant. */
async function faireMonter(db: Db, tournamentId: string, round: number, slot: number, playerId: string) {
  const suite = duelSuivant({ round, slot });
  const cible = (
    await db
      .select()
      .from(tournamentMatches)
      .where(
        and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(tournamentMatches.round, suite.round),
          eq(tournamentMatches.slot, suite.slot),
        ),
      )
      .limit(1)
  )[0];
  if (!cible) return; // c'était la finale

  await db
    .update(tournamentMatches)
    .set(suite.cote === "a" ? { playerAId: playerId } : { playerBId: playerId })
    .where(eq(tournamentMatches.id, cible.id));
}

/* ------------------------------------------------------------- résultat */

/**
 * Enregistrer le résultat d'un duel.
 *
 * Le vainqueur monte, le perdant garde le tour qu'il a atteint — c'est lui
 * qui décide de ses points de classement. Quand la finale tombe, le tournoi
 * se referme et les points partent sur les comptes.
 */
export async function noterResultat(
  db: Db,
  duelId: string,
  scoreA: number,
  scoreB: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const d = (await db.select().from(tournamentMatches).where(eq(tournamentMatches.id, duelId)).limit(1))[0];
  if (!d) return { ok: false, error: "Duel introuvable." };
  if (!d.playerAId || !d.playerBId) return { ok: false, error: "Ce duel attend encore ses deux joueurs." };
  if (scoreA === scoreB) return { ok: false, error: "Un duel ne peut pas finir à égalité." };
  if (Math.max(scoreA, scoreB) < d.raceTo) {
    return { ok: false, error: `La course est à ${d.raceTo} manches gagnantes.` };
  }

  const vainqueur = scoreA > scoreB ? d.playerAId : d.playerBId;
  const perdant = scoreA > scoreB ? d.playerBId : d.playerAId;

  await db
    .update(tournamentMatches)
    .set({ scoreA, scoreB, winnerId: vainqueur, status: "termine" })
    .where(eq(tournamentMatches.id, duelId));

  // Le perdant s'arrête ici ; le vainqueur, au moins au tour suivant.
  await db.update(tournamentPlayers).set({ reachedRound: d.round }).where(eq(tournamentPlayers.id, perdant));
  await db.update(tournamentPlayers).set({ reachedRound: d.round + 1 }).where(eq(tournamentPlayers.id, vainqueur));

  await faireMonter(db, d.tournamentId, d.round, d.slot, vainqueur);
  await cloreSiFini(db, d.tournamentId);
  return { ok: true };
}

/** La finale jouée, on ferme et on distribue les points. */
async function cloreSiFini(db: Db, tournamentId: string) {
  const duels = await getBracket(db, tournamentId);
  const dernierTour = Math.max(...duels.map((d) => d.round));
  const finale = duels.find((d) => d.round === dernierTour);
  if (!finale?.winnerId) return;

  const joueurs = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.tournamentId, tournamentId));

  for (const j of joueurs) {
    if (j.status !== "accepte") continue;
    const gagne = j.id === finale.winnerId;
    const points = pointsDeClassement(gagne ? dernierTour : j.reachedRound, dernierTour, gagne);
    await db
      .update(users)
      .set({ points: sql`${users.points} + ${points}` })
      .where(eq(users.id, j.userId));
  }

  const champion = joueurs.find((j) => j.id === finale.winnerId);
  await db
    .update(tournaments)
    .set({ status: "termine", winnerId: champion?.userId ?? null })
    .where(eq(tournaments.id, tournamentId));
}
