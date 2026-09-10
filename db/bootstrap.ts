import "server-only";
import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDb, getDbUrl } from "./client";
import { venues } from "./schema";

/**
 * Prépare la base au démarrage du serveur : migrations, puis jeu de
 * démonstration si elle est vide (premier boot, volume vierge).
 */
export async function bootstrapDatabase() {
  const db = createDb();

  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "db", "migrations") });
  } catch (error) {
    console.error("[kix] migrations impossibles :", error);
    return;
  }

  if (process.env.KIX_SKIP_SEED === "1") return;

  const rows = await db.select({ id: venues.id }).from(venues).limit(1);
  if (rows.length === 0) {
    console.log(`[kix] base vide (${getDbUrl()}) — chargement du jeu de démonstration`);
    const { seed } = await import("./seed");
    await seed();
  }
}
