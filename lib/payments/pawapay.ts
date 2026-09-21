import { createHash, timingSafeEqual } from "node:crypto";
import {
  normalizeStatus,
  type ChargeRequest,
  type ChargeResult,
  type PaymentMethod,
  type PaymentProvider,
  type PaymentSnapshot,
  type VerifyResult,
  type WebhookEvent,
} from "./types";

/**
 * pawaPay — encaissement Mobile Money (Orange Money, MTN MoMo).
 *
 * Deux choses à savoir sur leur API :
 *  · le `depositId` est un UUID **que nous choisissons** ; il rend l'appel
 *    idempotent, ce qui permet de réessayer sans double débit ;
 *  · tout est asynchrone. `POST /v2/deposits` ne dit que si la demande est
 *    acceptée ; le verdict arrive par callback, et reste interrogeable sur
 *    `GET /v2/deposits/{depositId}`.
 *
 * Référence : https://docs.pawapay.io/v2/api-reference/deposits/initiate-deposit
 */

const env = (key: string, fallback = "") => process.env[key]?.trim() || fallback;

/** Codes opérateurs pawaPay pour le Cameroun. */
const providerCode: Record<PaymentMethod, string> = {
  om: env("PAWAPAY_PROVIDER_OM", "ORANGE_CMR"),
  momo: env("PAWAPAY_PROVIDER_MOMO", "MTN_MOMO_CMR"),
};

const config = () => {
  const sandbox = env("PAWAPAY_ENV", "sandbox") !== "production";
  return {
    baseUrl: env(
      "PAWAPAY_BASE_URL",
      sandbox ? "https://api.sandbox.pawapay.io" : "https://api.pawapay.io",
    ).replace(/\/+$/, ""),
    token: env("PAWAPAY_API_TOKEN"),
    currency: env("PAWAPAY_CURRENCY", "XAF"),
    /** Indicatif pays, préfixé au numéro : pawaPay attend le format international sans +. */
    dialCode: env("PAWAPAY_DIAL_CODE", "237"),
    timeoutMs: Number(env("PAWAPAY_TIMEOUT_MS", "20000")),
  };
};

export const pawapayConfigured = () => Boolean(config().token);

/**
 * Le libellé que le client voit sur son téléphone au moment de valider.
 *
 * pawaPay n'y accepte *que* des lettres, des chiffres et des espaces, entre 4
 * et 22 caractères. Nos descriptions, elles, portent un point médian
 * (« Master Break · 3 jetons ») et parfois un titre d'événement accentué :
 * l'API refusait la demande avant même de joindre l'opérateur.
 *
 * On nettoie donc ici, au seul endroit par lequel tout passe, plutôt que dans
 * chaque appelant — un futur libellé ne peut pas rouvrir la panne.
 *
 * Les accents sont dépliés avant d'être retirés : « Réservation » devient
 * « Reservation », et non « R servation ».
 */
const LIMITE = 22;

export function customerMessage(text: string): string {
  const propre = text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (propre.length <= LIMITE) return propre.length >= 4 ? propre : "Master Break";

  // Couper au dernier mot entier plutôt qu'en plein milieu : « Billet Finale d »
  // n'inspire pas confiance au moment d'autoriser un débit. Si le premier mot
  // dépasse à lui seul, on tranche quand même — mieux vaut tronqué que refusé.
  const dur = propre.slice(0, LIMITE);
  const espace = dur.lastIndexOf(" ");
  const coupe = espace >= 4 ? dur.slice(0, espace) : dur;
  return coupe.length >= 4 ? coupe : "Master Break";
}

type PawaFailure = { failureCode?: string; failureMessage?: string };

/** Ce qu'on lit d'une réponse pawaPay — le reste est conservé tel quel en base. */
type PawaBody = {
  depositId?: string;
  status?: string;
  providerTransactionId?: string;
  failureReason?: PawaFailure | null;
  data?: PawaBody;
} | null;

async function call(path: string, init: RequestInit): Promise<{ status: number; body: PawaBody }> {
  const { baseUrl, token, timeoutMs } = config();
  const response = await fetch(baseUrl + path, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* réponse non-JSON : on garde le texte pour le journal */
  }
  return { status: response.status, body: (body ?? null) as PawaBody };
}

const reason = (failure: unknown): string | undefined => {
  if (!failure || typeof failure !== "object") return undefined;
  const f = failure as { failureCode?: string; failureMessage?: string };
  return f.failureMessage ?? f.failureCode;
};

export const pawapay: PaymentProvider = {
  name: "pawapay",
  get live() {
    return pawapayConfigured();
  },

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const { currency, dialCode } = config();

    try {
      const { status, body } = await call("/v2/deposits", {
        method: "POST",
        body: JSON.stringify({
          // Notre référence EST le depositId : l'appel devient idempotent.
          depositId: request.reference,
          payer: {
            type: "MMO",
            accountDetails: {
              phoneNumber: `${dialCode}${request.phone}`,
              provider: providerCode[request.method],
            },
          },
          amount: String(request.amount),
          currency,
          clientReferenceId: shortRef(request.reference),
          customerMessage: customerMessage(request.description),
        }),
      });

      if (status >= 400) {
        return { ok: false, error: reason(body?.failureReason) ?? `pawaPay HTTP ${status}`, detail: body };
      }

      // REJECTED : refusée d'emblée (opérateur indisponible, numéro invalide…).
      if (body?.status === "REJECTED") {
        return { ok: false, error: reason(body.failureReason) ?? "Demande refusée par l'opérateur", detail: body };
      }

      return {
        ok: true,
        providerRef: body?.depositId ?? request.reference,
        // ACCEPTED comme DUPLICATE_IGNORED : la demande est partie, on attend.
        status: "pending",
        instruction:
          request.method === "om"
            ? "Compose #150*50# et valide la demande avec ton code Orange Money."
            : "Compose *126# et valide la demande avec ton code MoMo.",
        detail: body,
      };
    } catch (error) {
      return { ok: false, error: `pawaPay injoignable : ${(error as Error).message}` };
    }
  },

  async verify(payment: PaymentSnapshot): Promise<VerifyResult> {
    try {
      const { status, body } = await call(`/v2/deposits/${encodeURIComponent(payment.reference)}`, {
        method: "GET",
      });

      if (status === 404 || body?.status === "NOT_FOUND") return { ok: true, status: "pending" };
      if (status >= 400) return { ok: false, error: `pawaPay HTTP ${status}` };

      const deposit = body?.data ?? body;
      return {
        ok: true,
        // ACCEPTED · PROCESSING · IN_RECONCILIATION → toujours en cours.
        status: normalizeStatus(deposit?.status),
        providerRef: deposit?.providerTransactionId ?? payment.providerRef,
        failureReason: reason(deposit?.failureReason),
        detail: deposit,
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  },

  /**
   * Les callbacks pawaPay sont signés en RFC-9421 avec leur clé publique. Plutôt
   * que de faire reposer l'encaissement sur cette vérification, on ne retient du
   * corps que l'identifiant du dépôt : `settlePayment` ira ensuite demander le
   * statut réel à pawaPay (voir la route). Une notification forgée ne peut donc
   * rien créditer. Quand `Content-Digest` est présent, on le vérifie quand même :
   * c'est gratuit et cela écarte les corps tronqués.
   */
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent | null {
    const digest = headers.get("content-digest");
    if (digest && !digestMatches(rawBody, digest)) return null;

    let body: { depositId?: string; status?: string; failureReason?: unknown };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!body.depositId) return null;

    return {
      reference: body.depositId,
      status: normalizeStatus(body.status),
      failureReason: reason(body.failureReason),
      detail: body,
    };
  },
};

/** `MB-XXXXXXXX` : la référence courte lisible sur un relevé d'opérateur. */
export const shortRef = (reference: string) => `MB-${reference.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

/** En-tête `Content-Digest` (RFC 9530) : `sha-256=:<base64>:`. */
export function digestMatches(rawBody: string, header: string): boolean {
  const match = /(sha-256|sha-512)=:([^:]+):/i.exec(header);
  if (!match) return false;

  const algo = match[1].toLowerCase() === "sha-512" ? "sha512" : "sha256";
  const expected = createHash(algo).update(rawBody, "utf8").digest("base64");
  const given = match[2];
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
