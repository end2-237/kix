import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import { createDb, createSql, getDbUrl } from "./client";
import { loadEnv } from "./env";

async function main() {
  loadEnv();
  const client = createSql();
  const db = createDb(client);
  await client`create schema if not exists mb`;
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "db", "migrations"), migrationsSchema: "mb" });
  console.log(`schéma mb à jour — ${getDbUrl().replace(/:[^:@]+@/, ":***@")}`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
