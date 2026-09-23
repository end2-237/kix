/**
 * Les règles du jeu, telles qu'on joue ici.
 *
 * Dans les salles camerounaises, une partie de billard se gagne à la noire :
 * chacun prend un camp — les rayés ou les pleins —, le rentre, puis met la
 * noire. Celui qui la met le premier, proprement, a gagné. Le reste n'est que
 * de la comptabilité : soit on s'arrête là (une partie sèche), soit on
 * enchaîne les parties jusqu'à ce que l'un en compte N (une course).
 *
 * Ce fichier ne connaît ni la base ni le serveur : il est le vocabulaire
 * commun des consoles d'arbitrage, des tableaux de tournoi et des écrans de
 * salle, pour qu'un joueur lise partout les mêmes mots.
 */

/** Les deux façons de compter un match. */
export type Mode = "seche" | "course";

/**
 * Le mode se lit dans la cible, il ne se stocke pas.
 *
 * Une partie sèche est exactement une course à une partie. Garder une colonne
 * de plus ne ferait qu'ouvrir la porte aux états impossibles — « sèche, en
 * cinq parties » — alors que la cible dit déjà tout.
 */
export function modeDuJeu(cible: number): Mode {
  return cible <= 1 ? "seche" : "course";
}

export const MODES: Record<Mode, { nom: string; court: string; resume: string }> = {
  seche: {
    nom: "Partie sèche",
    court: "sèche",
    resume:
      "Une seule partie. Chacun son camp — rayés ou pleins —, et le premier à mettre la noire gagne le match.",
  },
  course: {
    nom: "Course",
    court: "course",
    resume:
      "Plusieurs parties d'affilée. Chaque partie se gagne à la noire, et le premier à atteindre le nombre de parties gagne le match.",
  },
};

/** Les options d'un formulaire, dans l'ordre où on les propose. */
export const MODES_OPTIONS = [
  { value: "seche", label: `${MODES.seche.nom} · la noire` },
  { value: "course", label: "Course à N parties" },
];

/** « Partie sèche » ou « Course à 5 parties » — le nom complet, en toutes lettres. */
export function nomDuJeu(cible: number): string {
  return cible <= 1 ? MODES.seche.nom : `Course à ${cible} parties`;
}

/** « sèche » ou « course à 5 » — pour une ligne serrée, sous un score. */
export function jeuCourt(cible: number): string {
  return cible <= 1 ? MODES.seche.court : `course à ${cible}`;
}

/** La règle, en une phrase, à afficher sous un score ou dans un règlement. */
export function regleDuJeu(cible: number): string {
  return MODES[modeDuJeu(cible)].resume;
}

/** Une partie gagnée, au singulier ou au pluriel. */
export function parties(n: number): string {
  return `${n} partie${n > 1 ? "s" : ""}`;
}

/** Les deux camps d'une partie. */
export const CAMPS: Record<string, string> = { rayes: "Rayés", pleins: "Pleins" };

/** Ce qui décide une partie, où qu'on l'affiche. */
export const LA_NOIRE = "Le premier qui met la noire, son camp rentré, gagne la partie.";
