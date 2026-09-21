import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/**
 * Empreintes de mots de passe au format `scrypt$<sel>$<clé>`.
 *
 * scrypt vient de `node:crypto` : aucune dépendance native à compiler, ce qui
 * garde l'image de déploiement (nixpacks/Coolify) simple. Ce module n'importe ni
 * `server-only` ni la base : il sert aussi aux scripts CLI (db/seed.ts). Les
 * helpers téléphone vivent dans `lib/phone.ts`, sans import Node, pour que le
 * client puisse s'en servir aussi.
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

export * from "@/lib/phone";
