import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";

const file = process.env.DATABASE_URL ?? path.join(process.cwd(), "data", "kix.db");
fs.mkdirSync(path.dirname(file), { recursive: true });

const sqlite = new Database(file);
sqlite.pragma("journal_mode = WAL");
migrate(drizzle(sqlite), { migrationsFolder: path.join(process.cwd(), "db", "migrations") });
console.log(`base à jour — ${file}`);
