import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { createDb, dbUrl } from "./client";

async function main() {
  await migrate(createDb(), { migrationsFolder: path.join(process.cwd(), "db", "migrations") });
  console.log(`base à jour — ${dbUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
