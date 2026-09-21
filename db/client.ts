import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/**
 * SQLite via libsql : binaires précompilés (aucune compilation à l'installation)
 * et driver asynchrone, donc le même code tournera sur Postgres / Supabase.
 * DATABASE_URL accepte un chemin de fichier ou une URL libsql:// (Turso).
 */
export function getDbUrl(): string {
  // Chemin relatif au dossier de travail du serveur : SQLite le résout lui-même,
  // et le build n'a pas à tracer un chemin absolu calculé.
  const raw = process.env.DATABASE_URL ?? "data/masterbreak.db";
  return raw.includes("://") ? raw : `file:${raw}`;
}

export function createDb() {
  const url = getDbUrl();
  if (url.startsWith("file:")) {
    const dir = path.dirname(url.slice("file:".length));
    if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });
  }
  return drizzle(createClient({ url }), { schema });
}

export type Db = ReturnType<typeof createDb>;
