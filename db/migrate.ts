import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { createDb, getDbUrl } from "./client";

async function main() {
  await migrate(createDb(), { migrationsFolder: path.join(process.cwd(), "db", "migrations") });
  console.log(`base à jour — ${getDbUrl()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
