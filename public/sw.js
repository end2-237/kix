/**
 * Le service worker de Master Break.
 *
 * Il ne met rien en cache : l'application est dynamique de bout en bout — un
 * solde de jetons, un score en direct, une place de tournoi — et servir une
 * page d'hier ferait plus de mal qu'un chargement de plus. Il n'est là que
 * pour les notifications, et pour rendre l'application installable.
 *
 * Les messages arrivent SANS contenu : le serveur ne pousse qu'un signal, et
 * c'est d'ici qu'on va chercher la notification, avec le cookie de session.
 * Ni Apple ni Google ne voient donc jamais ce que dit la notification.
 */

const REPLI = {
  title: "Master Break",
  body: "Tu as du nouveau.",
  href: "/app/notifications",
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil(afficher());
});

async function afficher() {
  let n = REPLI;
  try {
    const r = await fetch("/api/push/derniere", { credentials: "include", cache: "no-store" });
    if (r.ok) {
      const lu = await r.json();
      if (lu && lu.title) n = lu;
    }
  } catch {
    // Hors ligne ou session expirée : on affiche quand même quelque chose.
    // iOS retire la permission à qui reçoit un push sans rien montrer.
  }

  await self.registration.showNotification(n.title, {
    body: n.body || "",
    icon: "/icon-192.png",
    badge: "/badge.png",
    tag: n.tag || "master-break",
    renotify: true,
    data: { href: n.href || REPLI.href },
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || REPLI.href;

  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Une fenêtre déjà ouverte est reprise plutôt que doublée : personne ne
      // veut quatre onglets de la même application au bout d'une soirée.
      for (const f of fenetres) {
        if (new URL(f.url).origin === self.location.origin) {
          await f.focus();
          if ("navigate" in f) await f.navigate(href);
          return;
        }
      }
      await self.clients.openWindow(href);
    })(),
  );
});
