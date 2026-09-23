"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { BellIcon, CheckIcon, PlusIcon } from "@/components/icons";
import type { ConfigFirebase } from "@/lib/firebase";

/**
 * Activer les notifications, et dire ce qu'il faut faire quand on ne peut pas.
 *
 * iOS est le cas particulier qui commande tout le reste : depuis la 16.4,
 * Safari sait recevoir des notifications web, mais **uniquement** si le site
 * a été ajouté à l'écran d'accueil. Tant qu'on est dans l'onglet Safari,
 * `Notification` n'existe même pas. Un bouton grisé sans explication ferait
 * croire à une panne — on montre donc la marche à suivre.
 */

const rienDuTout = () => () => {};
const useMonte = () =>
  useSyncExternalStore(
    rienDuTout,
    () => true,
    () => false,
  );

type Etat = "inconnu" | "impossible" | "ios" | "refusee" | "prete" | "active";

/** Enregistrer ce navigateur auprès du serveur. Idempotent : on peut répéter. */
async function inscrire(cleVapid: string, firebase?: ConfigFirebase | null, cleWebPushFirebase?: string) {
  const sw = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  // Firebase quand le projet est branché, le protocole standard sinon. Les
  // deux aboutissent au même service worker et à la même table : ce qui
  // change, c'est qui achemine le signal.
  let corps: Record<string, unknown> | null = null;

  if (firebase && cleWebPushFirebase) {
    try {
      const { jetonFcm } = await import("@/components/mb/fcm");
      const token = await jetonFcm(firebase, cleWebPushFirebase, sw);
      if (token) corps = { provider: "fcm", endpoint: token };
    } catch (e) {
      console.warn("[mb] Firebase indisponible, on passe par le push standard.", e);
    }
  }

  if (!corps) {
    if (!cleVapid) throw new Error("aucune clé d'envoi configurée");
    const abonnement =
      (await sw.pushManager.getSubscription()) ??
      (await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(cleVapid),
      }));
    corps = { provider: "web", ...abonnement.toJSON() };
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corps),
  });
  if (!res.ok) throw new Error("refus du serveur");
}

function b64ToU8(base64: string) {
  const complet = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const brut = atob(complet.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

function lire(): Etat {
  if (typeof window === "undefined") return "inconnu";

  const surIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  // `standalone` n'existe que sur Safari iOS : il dit si l'on tourne depuis
  // l'écran d'accueil.
  const installe =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return surIos && !installe ? "ios" : "impossible";
  }
  if (Notification.permission === "denied") return "refusee";
  if (Notification.permission === "granted") return "active";
  return "prete";
}

export function ActiverNotifications({
  cleVapid,
  firebase,
  cleWebPushFirebase,
}: {
  cleVapid: string;
  /** La configuration Firebase, quand le projet est branché. */
  firebase?: ConfigFirebase | null;
  cleWebPushFirebase?: string;
}) {
  const monte = useMonte();
  const { notify } = useSnackbar();
  const [etat, setEtat] = useState<Etat>("inconnu");
  const [travail, setTravail] = useState(false);
  const verifie = useRef(false);

  // L'état se lit au premier rendu côté navigateur, sans effet : il ne dépend
  // que d'API synchrones.
  const courant = etat === "inconnu" && monte ? lire() : etat;

  /**
   * « Autorisé » ne veut pas dire « inscrit ».
   *
   * La carte affichait « Notifications activées » dès que le navigateur avait
   * donné sa permission — même si aucun abonnement n'était jamais arrivé
   * jusqu'au serveur, parce que l'enregistrement avait échoué, ou parce que la
   * table a été refaite depuis. On le rejoue donc en silence à l'ouverture de
   * la page : c'est idempotent, et cela répare le cas sans rien demander.
   */
  useEffect(() => {
    if (!monte || verifie.current) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    verifie.current = true;

    void (async () => {
      try {
        await inscrire(cleVapid, firebase, cleWebPushFirebase);
      } catch (e) {
        console.warn("[mb] ce navigateur n'a pas pu être réinscrit", e);
        setEtat("prete");
      }
    })();
  }, [monte, cleVapid, firebase, cleWebPushFirebase]);

  async function tester() {
    setTravail(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const lu = (await res.json()) as { ok: boolean; error?: string; envoyes?: number };
      if (!lu.ok) {
        notify("Rien n'est parti", { detail: lu.error, tone: "warn" });
        return;
      }
      notify("Essai envoyé", {
        detail: `${lu.envoyes} appareil${(lu.envoyes ?? 0) > 1 ? "s" : ""} prévenu${(lu.envoyes ?? 0) > 1 ? "s" : ""}.`,
        tone: "jade",
      });
    } catch {
      notify("Essai impossible", { detail: "Le serveur n'a pas répondu.", tone: "warn" });
    } finally {
      setTravail(false);
    }
  }

  async function activer() {
    setTravail(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refusee" : "prete");
        notify("Notifications refusées", { detail: "Tu peux revenir sur ce choix dans le navigateur.", tone: "warn" });
        return;
      }

      await inscrire(cleVapid, firebase, cleWebPushFirebase);

      setEtat("active");
      notify("Notifications activées", { detail: "On te préviendra même application fermée.", tone: "jade" });
    } catch (e) {
      console.warn("[mb] activation des notifications impossible", e);
      notify("Activation impossible", { detail: "Réessaie, ou vérifie les réglages du navigateur.", tone: "warn" });
    } finally {
      setTravail(false);
    }
  }

  // Sans aucun chemin d'envoi configuré, la carte n'a rien à proposer.
  if (!monte || (!cleVapid && !(firebase && cleWebPushFirebase))) return null;

  if (courant === "ios") {
    return (
      <Card tone="dashed" shape="panel" className="flex flex-col gap-2 p-4">
        <span className="flex items-center gap-2 text-[14px] font-semibold">
          <PlusIcon size={16} /> Ajoute Master Break à ton écran d&apos;accueil
        </span>
        <p className="text-[12.5px] leading-5 text-muted">
          Sur iPhone, les notifications ne fonctionnent qu&apos;une fois l&apos;application installée. Touche
          le bouton <strong>Partager</strong> en bas de Safari, puis <strong>Sur l&apos;écran d&apos;accueil</strong>.
          Rouvre Master Break depuis l&apos;icône, et le bouton d&apos;activation apparaîtra ici.
        </p>
      </Card>
    );
  }

  if (courant === "impossible") {
    return (
      <Card tone="dashed" shape="panel" className="p-4 text-[12.5px] text-muted">
        Ce navigateur ne sait pas recevoir de notifications. Essaie Chrome, Firefox, ou Safari depuis
        l&apos;écran d&apos;accueil.
      </Card>
    );
  }

  if (courant === "refusee") {
    return (
      <Card tone="dashed" shape="panel" className="p-4 text-[12.5px] text-muted">
        Les notifications sont bloquées pour Master Break. Rouvre-les dans les réglages du navigateur —
        nous ne pouvons plus les redemander depuis la page.
      </Card>
    );
  }

  if (courant === "active") {
    return (
      <Card tone="jade" shape="panel" className="flex items-center gap-3 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-jade/20 text-jade-text">
          <CheckIcon size={17} />
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="text-[13.5px] font-semibold">Notifications activées</span>
          <span className="text-[11.5px] text-muted">
            Jetons, billets, tournois, et quand un ami se met à jouer.
          </span>
        </span>
        {/* Le seul moyen honnête de répondre à « je ne reçois rien » : essayer,
            et dire ce qui s'est passé. */}
        <button
          onClick={tester}
          disabled={travail}
          className="press flex h-10 shrink-0 items-center gap-2 rounded-full border border-line px-3.5 text-[12px] text-dim transition hover:text-ink disabled:opacity-50"
        >
          {travail ? <Spinner size={13} /> : null}
          Tester
        </button>
      </Card>
    );
  }

  return (
    <Card shape="panel" className="flex items-center gap-3 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
        <BellIcon size={17} />
      </span>
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold">Être prévenu sur ce téléphone</span>
        <span className="text-[11.5px] text-muted">
          Même application fermée : un ami qui joue, un jeton crédité, un tirage.
        </span>
      </span>
      <button
        onClick={activer}
        disabled={travail}
        className="press flex h-10 shrink-0 items-center gap-2 rounded-full bg-gold px-4 text-[12.5px] font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-50"
      >
        {travail ? <Spinner size={14} /> : null}
        Activer
      </button>
    </Card>
  );
}
