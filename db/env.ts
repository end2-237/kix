import fs from "node:fs";
import path from "node:path";

/**
 * Chargement des variables d'environnement pour les scripts CLI (migrate, seed).
 * Next.js lit `.env.local` tout seul ; `tsx` non — d'où ces quelques lignes,
 * qui évitent une dépendance de plus.
 */
export function loadEnv(files = [".env.local", ".env"]) {
  for (const file of files) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;

    for (const raw of fs.readFileSync(full, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue; // l'environnement réel gagne
      process.env[key] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}
