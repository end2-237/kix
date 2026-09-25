/**
 * Ce que le classement donne le droit de faire.
 *
 * Un classement qui ne sert qu'à s'afficher est un jeu de chiffres. Ici, il
 * ouvre des portes : un tournoi réservé à ceux qui tiennent la table, le droit
 * de diffuser une partie, celui d'enseigner. C'est ce qui donne une raison de
 * revenir jouer un mardi soir.
 *
 * Les seuils sont ici, en clair, et nulle part ailleurs — les déplacer se fait
 * en une ligne, et l'interface comme le serveur les lisent au même endroit.
 */

import { LEVELS, levelFor } from "@/lib/constants";

/** Le numéro de niveau d'un joueur, de 1 à 5. */
export function niveauDe(points: number): number {
  return levelFor(points).current.level;
}

export function nomDuNiveau(niveau: number): string {
  return LEVELS.find((l) => l.level === niveau)?.name ?? "Nouveau";
}

/** Combien de points il faut pour atteindre ce niveau. */
export function pointsDuNiveau(niveau: number): number {
  return LEVELS.find((l) => l.level === niveau)?.from ?? 0;
}

/** À partir de « Cogneur », on peut ouvrir un direct depuis son téléphone. */
export const NIVEAU_DIFFUSION = 3;

/** À partir de « Requin de table », on peut proposer des cours. */
export const NIVEAU_PROF = 4;

export const peutDiffuser = (points: number) => niveauDe(points) >= NIVEAU_DIFFUSION;
export const peutEnseigner = (points: number) => niveauDe(points) >= NIVEAU_PROF;

/** Ce qu'il manque pour y arriver, dit en points plutôt qu'en énigme. */
export function ilManque(points: number, niveau: number): number {
  return Math.max(0, pointsDuNiveau(niveau) - points);
}

/** Les options d'un formulaire : « Tous niveaux », puis chaque palier. */
export const NIVEAUX_REQUIS = [
  { value: "0", label: "Tous niveaux" },
  ...LEVELS.filter((l) => l.level > 1).map((l) => ({
    value: String(l.level),
    label: `${l.name} et plus`,
  })),
];

/** Comment on annonce l'exigence d'un tournoi sur son affiche. */
export function exigenceDuTournoi(minLevel: number): string {
  if (minLevel <= 1) return "Ouvert à tous les joueurs";
  return `Réservé aux ${nomDuNiveau(minLevel)}s et plus — ${pointsDuNiveau(minLevel)} points`;
}
