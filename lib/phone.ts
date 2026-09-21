/** Numéros camerounais. Aucun import Node : ce module sert aussi au client. */

/** 6 77 45 12 08 · +237677451208 · 00237 677 451 208 → 677451208 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.replace(/^(00)?237/, "");
}

export function isValidPhone(phone: string): boolean {
  return /^6\d{8}$/.test(phone);
}

/** 677451208 → 6 77 45 12 08 */
export function displayPhone(phone: string): string {
  const d = normalizePhone(phone);
  if (!isValidPhone(d)) return phone;
  return `${d[0]} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}
