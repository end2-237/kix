import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, notifications, tokens } from "@/db";

/** Petites règles partagées par les Server Actions et le service de paiement. */

export const uid = () => randomUUID();

/**
 * La base, ou la transaction en cours. Les deux helpers ci-dessous écrivent dans
 * celle qu'on leur passe : une notification émise pendant un paiement doit
 * disparaître avec lui si la transaction est annulée.
 */
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Code de secours à 4 chiffres, unique parmi les jetons encore actifs. */
export async function freshCode(exec: Executor = db): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const clash = await exec
      .select({ id: tokens.id })
      .from(tokens)
      .where(and(eq(tokens.code, code), eq(tokens.status, "active")))
      .limit(1);
    if (!clash[0]) return code;
  }
  return String(Date.now()).slice(-4);
}

export async function notify(
  userId: string,
  title: string,
  body: string,
  kind: string,
  href?: string,
  exec: Executor = db,
) {
  await exec.insert(notifications).values({ id: uid(), userId, title, body, kind, href, read: false });
  reveiller(userId);
}

/**
 * Pousser le signal vers les téléphones du compte.
 *
 * Sans `await` : une notification n'est pas le sujet de la requête en cours,
 * et un service de push lent ne doit pas retarder un paiement. Les erreurs
 * sont avalées pour la même raison — l'écrit en base, lui, a déjà eu lieu.
 *
 * Le push est envoyé même quand il part d'une transaction qui sera annulée :
 * le téléphone sonnerait alors pour une notification qui n'existe plus, et le
 * service worker, ne trouvant rien, affiche son message de repli. C'est le
 * prix d'un envoi hors transaction, et il est plus faible que celui d'une
 * transaction qui attend un serveur d'Apple.
 */
function reveiller(userId: string) {
  void import("@/lib/push")
    .then((m) => m.pousser([userId]))
    .catch(() => {});
}
