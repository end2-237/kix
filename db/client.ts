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
const raw = process.env.DATABASE_URL ?? path.join(process.cwd(), "data", "kix.db");
export const dbUrl = raw.includes("://") ? raw : `file:${path.resolve(raw)}`;

export function createDb() {
  if (dbUrl.startsWith("file:")) {
    fs.mkdirSync(path.dirname(dbUrl.slice("file:".length)), { recursive: true });
  }
  return drizzle(createClient({ url: dbUrl }), { schema });
}

export type Db = ReturnType<typeof createDb>;
