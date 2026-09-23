/**
 * La configuration Firebase, côté navigateur.
 *
 * Tout ce qui est ici est public par conception : la clé d'API d'une
 * application web Firebase identifie le projet, elle n'autorise rien à elle
 * seule — ce sont les règles de sécurité et les restrictions de la clé, dans
 * la console Google Cloud, qui décident de ce qui est permis. Elle est donc
 * livrée au navigateur, comme chez tout le monde.
 *
 * Elle passe malgré tout par l'environnement plutôt que d'être écrite en dur :
 * le dépôt ne doit rien porter qui dépende d'un compte, sans quoi un second
 * déploiement — une préproduction, un autre pays — oblige à modifier le code.
 */

export type ConfigFirebase = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

/**
 * Ce que l'hébergeur a pu ajouter autour de la valeur.
 *
 * Un panneau de variables d'environnement accepte volontiers
 * `NEXT_PUBLIC_FIREBASE_API_KEY="AIza…"` et garde les guillemets ; un
 * copier-coller laisse une espace ou un retour à la ligne. Google répond
 * alors « API key not valid », et l'on cherche la faute dans le code pendant
 * une heure. On nettoie donc à la lecture, une fois pour toutes.
 */
const propre = (valeur: string | undefined): string =>
  (valeur ?? "").trim().replace(/^["']([\s\S]*)["']$/, "$1").trim();

/** Une clé d'API Google : `AIza` suivi de 35 caractères. */
export const ressembleAUneCleGoogle = (cle: string) => /^AIza[0-9A-Za-z_-]{35}$/.test(cle);

export function configFirebase(): ConfigFirebase | null {
  const apiKey = propre(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const projectId = propre(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const appId = propre(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
  const messagingSenderId = propre(process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID);
  if (!apiKey || !projectId || !appId || !messagingSenderId) return null;

  // Une clé mal recopiée ne sert à rien, et pire : elle fait échouer
  // l'enregistrement Firebase, donc les notifications, alors que le protocole
  // standard — qui ne dépend pas de Google — aurait très bien fonctionné. On
  // préfère débrancher Firebase et le dire.
  if (!ressembleAUneCleGoogle(apiKey)) {
    console.error(
      "[mb] NEXT_PUBLIC_FIREBASE_API_KEY ne ressemble pas à une clé Google " +
        `(attendu « AIza » + 35 caractères, reçu ${apiKey.length} caractères). ` +
        "Vérifie qu'aucun guillemet ni espace ne traîne autour de la valeur. " +
        "Firebase reste débranché ; les notifications passent par le protocole standard.",
    );
    return null;
  }

  return {
    apiKey,
    authDomain: propre(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: propre(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || `${projectId}.firebasestorage.app`,
    messagingSenderId,
    appId,
    measurementId: propre(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || undefined,
  };
}

/** La clé publique du certificat Web Push, donnée par la console Firebase. */
export const cleWebPushFirebase = () => propre(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);

/**
 * Firebase est-il utilisable pour les notifications ?
 *
 * Il faut la configuration **et** la clé Web Push : sans elle, `getToken` ne
 * rend rien, et l'on afficherait un bouton qui ne mène nulle part.
 */
export const fcmPret = () => configFirebase() !== null && cleWebPushFirebase().length > 0;
