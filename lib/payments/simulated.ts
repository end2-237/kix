import { createHmac, timingSafeEqual } from "node:crypto";
import {
  normalizeStatus,
  type ChargeRequest,
  type ChargeResult,
  type PaymentProvider,
  type PaymentSnapshot,
  type VerifyResult,
  type WebhookEvent,
} from "./types";

/**
 * Encaisseur de démonstration, utilisé tant que `POWERPAY_API_KEY` est absent.
 *
 * Il reproduit le rythme réel — quelques secondes d'attente pendant que le
 * client compose son code — pour que le parcours, les écrans d'attente et le
 * webhook soient les mêmes qu'en production. Deux numéros de test :
 *   6XX XXX 000 → le paiement échoue (solde insuffisant)
 *   6XX XXX 999 → le paiement reste en attente (client qui ne valide jamais)
 */

const DELAY_MS = Number(process.env.MB_SIMULATED_DELAY_MS ?? 4000);

const outcomeFor = (phone: string) =>
  phone.endsWith("000") ? "failed" : phone.endsWith("999") ? "pending" : "paid";

export const simulated: PaymentProvider = {
  name: "simulated",
  live: false,

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    return {
      ok: true,
      providerRef: `SIM-${request.reference}`,
      status: "pending",
      instruction:
        request.method === "om"
          ? "Compose #150*50# et valide avec ton code secret Orange Money."
          : "Compose *126# et valide avec ton code secret MoMo.",
      detail: { simulated: true, amount: request.amount },
    };
  },

  async verify(payment: PaymentSnapshot): Promise<VerifyResult> {
    const elapsed = Date.now() - payment.createdAt.getTime();
    if (elapsed < DELAY_MS) return { ok: true, status: "pending" };

    const outcome = outcomeFor(payment.phone);
    if (outcome === "failed") {
      return { ok: true, status: "failed", failureReason: "Solde insuffisant", detail: { simulated: true } };
    }
    if (outcome === "pending") return { ok: true, status: "pending" };
    return { ok: true, status: "paid", providerRef: payment.providerRef, detail: { simulated: true } };
  },

  /**
   * Le webhook simulé reste signé : sans `MB_SIMULATED_WEBHOOK_SECRET`, rien
   * n'est accepté. Une route publique non signée serait une porte ouverte, même
   * en démonstration.
   */
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent | null {
    const secret = process.env.MB_SIMULATED_WEBHOOK_SECRET?.trim();
    if (!secret) return null;

    const given = (headers.get("x-mb-signature") ?? "").trim();
    const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    if (given.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;

    let body: { reference?: string; status?: string; reason?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!body.reference) return null;

    return {
      reference: body.reference,
      status: normalizeStatus(body.status),
      failureReason: body.reason,
      detail: body,
    };
  },
};
