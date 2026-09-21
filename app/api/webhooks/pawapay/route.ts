import { paymentProvider } from "@/lib/payments";
import { confirmFromProvider, settlePayment } from "@/lib/payments/service";

/**
 * Callback de paiement pawaPay.
 *
 * La route est publique. Plutôt que de faire reposer l'encaissement sur la
 * seule signature du corps, on ne retient de la notification que l'identifiant
 * du dépôt, puis on redemande son statut à pawaPay avec notre jeton d'API : une
 * notification forgée ne peut donc rien créditer, même si la signature nous
 * échappe. `settlePayment` étant idempotent, les répétitions de l'opérateur sont
 * sans conséquence.
 *
 * https://docs.pawapay.io/v2/api-reference/deposits/deposit-callback
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const provider = paymentProvider();
  const event = provider.parseWebhook(raw, request.headers);

  if (!event) {
    return Response.json({ error: "notification illisible ou non signée" }, { status: 401 });
  }

  // On répond 200 même sur référence inconnue : sinon l'opérateur réessaie sans fin.
  const payment = provider.live
    ? await confirmFromProvider(event.reference)
    : await settlePayment(event.reference, event);

  if (!payment) return Response.json({ ok: true, unknown: true });
  return Response.json({ ok: true, status: payment.status });
}

/** Sonde de vie : pratique pour vérifier l'URL depuis le tableau de bord pawaPay. */
export async function GET() {
  const provider = paymentProvider();
  return Response.json({ ok: true, provider: provider.name, live: provider.live });
}
