/** Règles métier partagées entre le serveur et l'interface. */
export const XP_PER_TOKEN = 40;
export const POINTS_PER_FREE_TOKEN = 500;
export const COMMISSION_RATE = 0.1;
export const DELIVERY_FEE = 1000;
export const LEVELS = [
  { level: 1, name: "Nouveau", from: 0 },
  { level: 2, name: "Habitué", from: 400 },
  { level: 3, name: "Cogneur", from: 800 },
  { level: 4, name: "Requin de table", from: 1200 },
  { level: 5, name: "Roi de la 8", from: 2000 },
] as const;

export function levelFor(points: number) {
  const current = [...LEVELS].reverse().find((l) => points >= l.from) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.from > points);
  return { current, next, target: next?.from ?? current.from };
}
