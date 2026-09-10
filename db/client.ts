import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

export const dbFile = process.env.DATABASE_URL ?? path.join(process.cwd(), "data", "kix.db");

/** Ouvre une connexion SQLite (scripts CLI et runtime serveur). */
export function createDb() {
  const sqlite = new Database(dbFile);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;
