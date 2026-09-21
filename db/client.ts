import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres (Supabase auto-hébergé). Toutes les tables vivent dans le schéma
 * `mb` : `search_path` le rend prioritaire, `public` reste accessible pour les
 * extensions.
 */
export function getDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant — voir .env.example");
  return url;
}

export function createSql() {
  return postgres(getDbUrl(), {
    max: Number(process.env.DATABASE_POOL ?? 10),
    prepare: false, // compatible avec le pooler Supabase en mode transaction
    connection: { search_path: "mb, public" },
    // Les migrations utilisent `if not exists` : leurs NOTICE ne sont pas des
    // avertissements. MB_DB_NOTICES=1 les réaffiche au besoin.
    onnotice: process.env.MB_DB_NOTICES === "1" ? undefined : () => {},
  });
}

export function createDb(client = createSql()) {
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
