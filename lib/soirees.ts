/**
 * L'état d'une soirée, sans base de données.
 *
 * Une affiche ne disparaît pas quand la nuit se termine : elle reste, marquée
 * « terminé », avec sa recette et sa liste d'entrées. Ce qui change, c'est
 * qu'on n'y vend plus de billet. Trois états suffisent à le dire, et ils se
 * lisent aussi bien dans la console du gérant que sur l'écran d'un joueur.
 */

export type EtatSoiree = "affiche" | "terminee" | "masquee";

export const ETATS_SOIREE: Record<EtatSoiree, string> = {
  affiche: "À l'affiche",
  terminee: "Terminé",
  masquee: "Masqué",
};

/** Une soirée close reste close, même si on la republie. */
export function soireeTerminee(endedAt: Date | string | null | undefined): boolean {
  if (!endedAt) return false;
  const fin = endedAt instanceof Date ? endedAt : new Date(endedAt);
  return !Number.isNaN(fin.getTime()) && fin.getTime() <= Date.now();
}

export function etatSoiree(e: { active: boolean; endedAt: Date | string | null }): EtatSoiree {
  if (soireeTerminee(e.endedAt)) return "terminee";
  return e.active ? "affiche" : "masquee";
}

/** On ne vend un billet que pour une soirée à l'affiche. */
export function billetterieOuverte(e: { active: boolean; endedAt: Date | string | null }): boolean {
  return etatSoiree(e) === "affiche";
}
