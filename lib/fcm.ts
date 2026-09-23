import { createSign } from "node:crypto";

/**
 * Envoi par Firebase Cloud Messaging, API HTTP v1.
 *
 * Deux requêtes, et aucune dépendance : on échange un JWT signé par le compte
 * de service contre un jeton d'accès Google, puis on poste le message. Le SDK
 * Admin de Firebase ne fait rien d'autre, avec une centaine de mégaoctets de
 * plus.
 *
 * Le compte de service, lui, est un vrai secret — contrairement à la clé d'API
 * web. Il vit dans l'environnement, jamais dans le dépôt.
 *
 * Le message part **sans contenu**, comme les envois standards : le service
 * worker vient lire la notification chez nous avec le cookie de session.
 * Google voit donc passer un signal vide, pas ce qu'il annonce.
 */

type CompteDeService = {
  client_email: string;
  private_key: string;
  project_id: string;
};

/**
 * Le compte de service, sous l'une des trois formes qu'on rencontre.
 *
 * Firebase le livre en fichier `.json` téléchargé, et une variable
 * d'environnement ne prend pas un fichier. Trois chemins, donc, du plus
 * commode au plus brut :
 *
 *  1. deux variables — `FIREBASE_CLIENT_EMAIL` et `FIREBASE_PRIVATE_KEY` —
 *     recopiées depuis le fichier. C'est le plus simple : deux champs à
 *     sélectionner, rien à encoder ;
 *  2. `FIREBASE_SERVICE_ACCOUNT` avec le JSON entier collé tel quel ;
 *  3. le même, encodé en base64, pour les hébergeurs qui abîment les
 *     retours à la ligne.
 *
 * Dans tous les cas, les « \n » littéraux de la clé privée sont remis en
 * vrais sauts de ligne : c'est ainsi que le JSON les stocke, et OpenSSL
 * refuse une clé qui les garde échappés.
 */
function compte(): CompteDeService | null {
  const separe = compteEnDeuxVariables();
  if (separe) return separe;

  const brut = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!brut) return null;

  const texte = brut.startsWith("{") ? brut : Buffer.from(brut, "base64").toString("utf8");
  try {
    const lu = JSON.parse(texte) as CompteDeService;
    if (!lu.client_email || !lu.private_key || !lu.project_id) return null;
    return { ...lu, private_key: remettreLesSauts(lu.private_key) };
  } catch {
    return null;
  }
}

/** La forme à deux variables, recopiée à la main depuis le fichier. */
function compteEnDeuxVariables(): CompteDeService | null {
  const client_email = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const brut = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const project_id =
    process.env.FIREBASE_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!client_email || !brut || !project_id) return null;

  // Certaines interfaces ajoutent des guillemets autour de la valeur collée.
  const sansGuillemets = brut.replace(/^["']|["']$/g, "");
  return { client_email, private_key: remettreLesSauts(sansGuillemets), project_id };
}

const remettreLesSauts = (cle: string) => cle.replace(/\\n/g, "\n");

export const fcmConfigure = () => compte() !== null;

const b64url = (v: string | Buffer) =>
  Buffer.from(v).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * Le jeton d'accès, gardé en mémoire jusqu'à son expiration.
 *
 * Google en délivre un valable une heure. Le redemander à chaque notification
 * ajouterait un aller-retour à chaque jeton crédité, pour rien.
 */
let cache: { jeton: string; expire: number } | null = null;

async function jetonAcces(sa: CompteDeService): Promise<string | null> {
  if (cache && cache.expire > Date.now() + 60_000) return cache.jeton;

  const maintenant = Math.floor(Date.now() / 1000);
  const entete = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: maintenant,
      exp: maintenant + 3600,
    }),
  );
  const signature = b64url(
    createSign("RSA-SHA256").update(`${entete}.${corps}`).end().sign(sa.private_key),
  );

  const reponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${entete}.${corps}.${signature}`,
    }),
  });
  if (!reponse.ok) return null;

  const lu = (await reponse.json()) as { access_token?: string; expires_in?: number };
  if (!lu.access_token) return null;

  cache = { jeton: lu.access_token, expire: Date.now() + (lu.expires_in ?? 3600) * 1000 };
  return lu.access_token;
}

export type SortieFcm = "envoye" | "mort" | "ignore";

/**
 * Pousse un signal vers un jeton d'enregistrement.
 *
 * `mort` signale un jeton qu'il faut retirer : c'est ainsi que FCM annonce
 * une application désinstallée ou des données de navigateur effacées.
 */
export async function envoyerFcm(token: string, urgence: "normal" | "high" = "normal"): Promise<SortieFcm> {
  const sa = compte();
  if (!sa) return "ignore";

  const acces = await jetonAcces(sa);
  if (!acces) return "ignore";

  const reponse = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${acces}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          // Aucun `notification` : c'est le service worker qui composera la
          // bulle après avoir lu la notification chez nous. Un bloc
          // `notification` ferait afficher le texte par le navigateur, et le
          // ferait donc transiter par Google.
          data: { mb: "1" },
          webpush: {
            headers: { TTL: "43200", Urgency: urgence },
          },
        },
      }),
    },
  );

  if (reponse.ok) return "envoye";

  // 404 : jeton inconnu. 400 avec INVALID_ARGUMENT sur le jeton : idem.
  if (reponse.status === 404) return "mort";
  const detail = await reponse.text().catch(() => "");
  if (reponse.status === 403 || detail.includes("UNREGISTERED") || detail.includes("registration-token-not-registered")) {
    return reponse.status === 403 ? "ignore" : "mort";
  }
  return "ignore";
}

/** Le projet visé, pour les écrans de diagnostic. */
export const projetFcm = () => compte()?.project_id ?? null;
