import { pawapay, pawapayConfigured } from "./pawapay";
import { simulated } from "./simulated";
import type { PaymentProvider } from "./types";

export * from "./types";

/**
 * pawaPay dès que son jeton d'API est là, sinon l'encaisseur de démonstration.
 * `MB_PAYMENT_PROVIDER` force l'un ou l'autre (utile en recette).
 */
export function paymentProvider(): PaymentProvider {
  const forced = process.env.MB_PAYMENT_PROVIDER?.trim().toLowerCase();
  if (forced === "pawapay") return pawapay;
  if (forced === "simulated") return simulated;
  return pawapayConfigured() ? pawapay : simulated;
}
