/**
 * Au démarrage du serveur : applique les migrations, et remplit la base si elle
 * est vide. Le conteneur déployé est ainsi utilisable sans commande manuelle,
 * y compris quand un volume vierge est monté sur data/.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const path = await import("node:path");
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  const { createDb, dbUrl } = await import("./db/client");
  const { venues } = await import("./db/schema");

  const db = createDb();

  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "db", "migrations") });
  } catch (error) {
    console.error("[kix] migrations impossibles :", error);
    return;
  }

  const rows = await db.select({ id: venues.id }).from(venues).limit(1);
  if (rows.length === 0 && process.env.KIX_SKIP_SEED !== "1") {
    console.log(`[kix] base vide (${dbUrl}) — chargement du jeu de démonstration`);
    const { seed } = await import("./db/seed");
    await seed();
  }
}
