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


/**
 * Ce que chaque palier ouvre, en toutes lettres.
 *
 * Un privilège que personne ne connaît ne fait revenir personne : le joueur
 * doit pouvoir lire, avant de les atteindre, ce que valent les paliers. Cette
 * table est la seule source de la page des niveaux — ajouter un privilège se
 * fait ici, à côté du seuil qui le commande.
 */
export type Palier = {
  niveau: number;
  nom: string;
  points: number;
  avantages: string[];
};

export const PALIERS: Palier[] = LEVELS.map((l) => ({
  niveau: l.level,
  nom: l.name,
  points: l.from,
  avantages: avantagesDu(l.level),
}));

function avantagesDu(niveau: number): string[] {
  switch (niveau) {
    case 1:
      return [
        "Jouer, scanner ses jetons et compter ses points",
        "Les tournois ouverts à tous",
        "Réserver une table, prendre ses billets",
      ];
    case 2:
      return ["Les tournois réservés aux Habitués et plus"];
    case 3:
      return [
        "Ouvrir un direct depuis son téléphone",
        "Toucher sa part des billets vidéo, moins la commission",
        "Les tournois réservés aux Cogneurs et plus",
      ];
    case 4:
      return [
        "Proposer des cours et être payé sur les inscriptions",
        "Voir ses élèves, et les rappeler à son cours une fois par semaine",
        "Les tournois réservés aux Requins de table et plus",
      ];
    default:
      return [
        "Le haut du classement, et les tournois qui s'y réservent",
        "Tout ce que les paliers précédents ont ouvert",
      ];
  }
}
