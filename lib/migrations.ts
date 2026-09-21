import "server-only";
import fs from "node:fs";
import path from "node:path";

export const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

/**
 * Combien de migrations l'image embarque-t-elle réellement ?
 *
 * Drizzle applique ce qu'il trouve sur le disque, sans se plaindre s'il ne
 * trouve rien. Un dossier absent de l'image de déploiement produit donc un
 * démarrage parfaitement silencieux et une base parfaitement vide. On compte
 * ici, pour pouvoir le dire.
 */
export function availableMigrations(): number {
  try {
    const journal = path.join(MIGRATIONS_DIR, "meta", "_journal.json");
    const parsed = JSON.parse(fs.readFileSync(journal, "utf8")) as { entries?: unknown[] };
    return parsed.entries?.length ?? 0;
  } catch {
    return 0;
  }
}
