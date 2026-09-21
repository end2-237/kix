import { createSql } from "./client";
import { loadEnv } from "./env";

/**
 * Remet le schéma `mb` à zéro. Ne touche à rien d'autre : les autres
 * applications du Supabase partagé vivent dans leurs propres schémas.
 */
async function main() {
  loadEnv();
  const client = createSql();
  await client`drop schema if exists mb cascade`;
  console.log("schéma mb supprimé");
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
