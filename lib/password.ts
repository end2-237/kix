import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/**
 * Empreintes de mots de passe au format `scrypt$<sel>$<clé>`.
 *
 * scrypt vient de `node:crypto` : aucune dépendance native à compiler, ce qui
 * garde l'image de déploiement (nixpacks/Coolify) simple. Ce module n'importe ni
 * `server-only` ni la base : il sert aussi aux scripts CLI (db/seed.ts).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, salt, hex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = (await scryptAsync(password.normalize("NFKC"), salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ------------------------------------------------------------------- téléphone */

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
