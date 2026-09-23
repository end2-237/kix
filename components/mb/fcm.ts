"use client";

import type { ConfigFirebase } from "@/lib/firebase";

/**
 * L'enregistrement auprès de Firebase Cloud Messaging.
 *
 * Chargé à la demande : le SDK Firebase pèse une centaine de kilo-octets, et
 * personne ne doit les télécharger pour consulter son solde de jetons. On ne
 * l'importe qu'au moment où quelqu'un demande à être prévenu.
 *
 * Le service worker est le nôtre, celui qui sert déjà aux envois standards :
 * `getToken` accepte qu'on lui passe une inscription plutôt que d'aller
 * chercher `firebase-messaging-sw.js`. Un seul service worker, un seul
 * comportement à tenir.
 */
export async function jetonFcm(
  config: ConfigFirebase,
  cleWebPush: string,
  sw: ServiceWorkerRegistration,
): Promise<string | null> {
  const [{ initializeApp, getApps, getApp }, messaging] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);

  if (!(await messaging.isSupported())) return null;

  const app = getApps().length ? getApp() : initializeApp(config);
  const token = await messaging.getToken(messaging.getMessaging(app), {
    vapidKey: cleWebPush,
    serviceWorkerRegistration: sw,
  });
  return token || null;
}
