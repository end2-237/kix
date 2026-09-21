import { loadEnv } from "./env";

/**
 * Entrée en ligne de commande du seed (`npm run db:seed`).
 *
 * Elle est séparée de `db/seed.ts` parce que ce dernier est aussi importé par le
 * serveur : y laisser la lecture de `.env` ferait tracer tout le projet au build.
 */
async function main() {
  loadEnv();
  const { seed } = await import("./seed");
  await seed();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
