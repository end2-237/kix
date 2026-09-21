/**
 * Ce que vaut un jeton.
 *
 * On ne vend que des packs : un pack à 1000 F pour trois jetons en vaut 333
 * l'unité, pas le tarif unitaire affiché par la salle. Sans cette répartition,
 * la recette du gérant gonflait d'un tiers à chaque partie scannée.
 */

/**
 * Répartit un montant sur `nombre` jetons, au franc près.
 *
 * La division entière perd le reste — 1000 F sur trois jetons donnerait
 * 333 × 3 = 999 F. Le ou les francs manquants vont aux premiers jetons, si
 * bien que la somme retombe toujours exactement sur ce qui a été payé. Sur une
 * soirée, cet écart d'un franc par pack finirait par se voir dans la caisse.
 */
export function repartirPrix(total: number, nombre: number): number[] {
  if (nombre <= 0) return [];
  const base = Math.floor(total / nombre);
  const reste = total - base * nombre;
  return Array.from({ length: nombre }, (_, i) => base + (i < reste ? 1 : 0));
}

/** Le minimum vendable : on ne joue pas à moins d'un pack. */
export const JETONS_MIN_PACK = 3;
