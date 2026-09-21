import { sql } from "drizzle-orm";
import { db, venues } from "@/db";
import { media } from "@/lib/stream";
import { paymentProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * État de santé, pour diagnostiquer un déploiement en un appel.
 *
 * Rien de secret n'en sort : des booléens, des comptes et, en cas de panne, le
 * code d'erreur du driver — jamais l'URL ni un identifiant. C'est ce qui
 * distingue « la base est injoignable » de « les migrations manquent », les
 * deux causes qui donnent le même écran blanc côté navigateur.
 */
/** Les pannes qu'on rencontre vraiment, et ce qu'il faut faire pour chacune. */
function explain(code: string | undefined): string | null {
  switch (code) {
    case "ECONNREFUSED":
      return "base injoignable — rien n'écoute à cette adresse ; vérifie l'hôte et le port de DATABASE_URL";
    case "ENOTFOUND":
    case "EAI_AGAIN":
      // Le cas le plus fréquent en conteneur : le nom court d'un service voisin
      // ne se résout que depuis le réseau Docker de ce service.
      return "nom d'hôte non résolu — si DATABASE_URL pointe sur un nom court comme « db », l'app doit être sur le même réseau Docker que Supabase ; sinon, utilise l'adresse et le port exposés";
    case "ETIMEDOUT":
      return "délai dépassé — un pare-feu bloque probablement le port Postgres";
    case "28P01":
      return "mot de passe refusé — vérifie l'identifiant dans DATABASE_URL";
    case "28000":
      return "connexion refusée par pg_hba — ce rôle n'a pas le droit de se connecter depuis cette adresse";
    case "3D000":
      return "base inconnue — vérifie le nom de la base dans DATABASE_URL";
    case "42P01":
      return "tables absentes — lance « npm run db:migrate »";
    case "42501":
      return "droits manquants sur le schéma mb — ce rôle ne peut pas le lire ; connecte-toi avec le propriétaire";
    case "3F000":
      return "schéma mb absent — lance « npm run db:migrate »";
    case "53300":
      return "trop de connexions — baisse DATABASE_POOL ou monte max_connections";
    default:
      return null;
  }
}

export async function GET() {
  const report: Record<string, unknown> = { ok: false, at: new Date().toISOString() };

  try {
    const applied = await db.execute(
      sql`select count(*)::int as n from mb.__drizzle_migrations`,
    );
    const rows = await db.select({ n: sql<number>`count(*)::int` }).from(venues);

    report.db = "ok";
    report.migrations = Number((applied as unknown as { n: number }[])[0]?.n ?? 0);
    report.venues = Number(rows[0]?.n ?? 0);
    report.ok = true;
  } catch (error) {
    // Drizzle enveloppe l'erreur du driver : le code Postgres est dans `cause`.
    const e = error as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    const code = e.code ?? e.cause?.code;

    report.db = "ko";
    report.code = code;
    report.reason = explain(code) ?? (e.cause?.message ?? e.message ?? "erreur inconnue").slice(0, 160);
  }

  // Les intégrations facultatives : configurées ou en mode dégradé.
  report.paiements = paymentProvider().name;
  report.media = media().configured ? "configuré" : "absent";
  report.qrSecret = Boolean(process.env.MB_QR_SECRET);
  report.publicUrl = Boolean(process.env.MB_PUBLIC_URL);

  return Response.json(report, { status: report.ok ? 200 : 503 });
}
