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

export function configFirebase(): ConfigFirebase | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID;
  if (!apiKey || !projectId || !appId || !messagingSenderId) return null;

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`,
    messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

/** La clé publique du certificat Web Push, donnée par la console Firebase. */
export const cleWebPushFirebase = () => process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

/**
 * Firebase est-il utilisable pour les notifications ?
 *
 * Il faut la configuration **et** la clé Web Push : sans elle, `getToken` ne
 * rend rien, et l'on afficherait un bouton qui ne mène nulle part.
 */
export const fcmPret = () => configFirebase() !== null && cleWebPushFirebase().length > 0;
