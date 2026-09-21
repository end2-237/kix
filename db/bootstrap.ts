import "server-only";
import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb, createSql } from "./client";
import { venues } from "./schema";

/** Pannes qui se résolvent d'elles-mêmes : la base démarre encore, le DNS du
 *  réseau n'est pas prêt, le pare-feu n'a pas fini de s'ouvrir. */
const TRANSIENT = new Set(["EAI_AGAIN", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "57P03"]);

const codeOf = (error: unknown): string | undefined => {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Prépare la base au démarrage : migrations, puis jeu de démonstration si le
 * schéma est vide.
 *
 * Dans un conteneur, l'application démarre souvent avant sa base — ou avant que
 * le nom de celle-ci soit résolvable sur le réseau. Abandonner au premier échec
 * laissait alors une application en marche mais incapable de servir une seule
 * page. On réessaie donc, en espaçant, tant que l'erreur est de celles qui
 * passent ; une erreur de configuration, elle, ne s'arrange pas en attendant et
 * s'affiche tout de suite.
 */
export async function bootstrapDatabase() {
  const attempts = Number(process.env.MB_DB_RETRIES ?? 10);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const client = createSql();
    const db = createDb(client);

    try {
      await client`create schema if not exists mb`;
      await migrate(db, {
        migrationsFolder: path.join(process.cwd(), "db", "migrations"),
        migrationsSchema: "mb",
      });

      await finish(db);
      await client.end();
      if (attempt > 1) console.log(`[mb] base prête après ${attempt} tentatives`);
      return;
    } catch (error) {
      await client.end().catch(() => {});
      const code = codeOf(error);

      if (!TRANSIENT.has(code ?? "")) {
        console.error(`[mb] démarrage impossible (${code ?? "erreur"}) :`, error);
        return;
      }

      if (attempt === attempts) {
        console.error(
          `[mb] base toujours injoignable après ${attempts} tentatives (${code}). ` +
            "L'application démarre quand même : /api/health dira ce qui bloque.",
        );
        return;
      }

      // 1 s, 2 s, 4 s… plafonnées à 15 s : on laisse le temps au réseau.
      const delay = Math.min(15_000, 1000 * 2 ** (attempt - 1));
      console.warn(`[mb] base injoignable (${code}), nouvelle tentative dans ${delay / 1000} s…`);
      await wait(delay);
    }
  }
}

/** Ce qui suit les migrations : jeu de démonstration, ménage. */
async function finish(db: ReturnType<typeof createDb>) {
  if (process.env.MB_SKIP_SEED !== "1") {
    const rows = await db.select({ id: venues.id }).from(venues).limit(1);
    if (rows.length === 0) {
      console.log("[mb] schéma vide — chargement du jeu de démonstration");
      const { seed } = await import("./seed");
      await seed();
    }
  }

  // Les sessions expirées ne servent plus qu'à grossir la table.
  const { purgeExpiredSessions } = await import("@/lib/auth");
  await purgeExpiredSessions();

  // Un paiement laissé en attente (onglet fermé, webhook perdu) doit finir
  // quelque part : on le passe en expiré au démarrage.
  const { expireStalePayments } = await import("@/lib/payments/service");
  const expired = await expireStalePayments();
  if (expired > 0) console.log(`[mb] ${expired} paiement(s) expiré(s)`);
}
