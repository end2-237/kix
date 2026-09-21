import "server-only";
import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb, createSql } from "./client";
import { venues } from "./schema";

/**
 * Prépare la base au démarrage du serveur : migrations, puis jeu de
 * démonstration si le schéma est vide.
 */
export async function bootstrapDatabase() {
  const client = createSql();
  const db = createDb(client);

  try {
    await client`create schema if not exists mb`;
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "db", "migrations"),
      migrationsSchema: "mb",
    });
  } catch (error) {
    console.error("[mb] migrations impossibles :", error);
    await client.end();
    return;
  }

  if (process.env.MB_SKIP_SEED === "1") {
    await client.end();
    return;
  }

  const rows = await db.select({ id: venues.id }).from(venues).limit(1);
  if (rows.length === 0) {
    console.log("[mb] schéma vide — chargement du jeu de démonstration");
    const { seed } = await import("./seed");
    await seed();
  }

  // Les sessions expirées ne servent plus qu'à grossir la table.
  const { purgeExpiredSessions } = await import("@/lib/auth");
  await purgeExpiredSessions();

  await client.end();
}
