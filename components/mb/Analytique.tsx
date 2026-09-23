"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ConfigFirebase } from "@/lib/firebase";

/**
 * Firebase Analytics, chargé à part.
 *
 * Le SDK pèse lourd et n'apporte rien au premier affichage : on ne le charge
 * donc qu'après le montage, et jamais sur le rendu serveur. Une application
 * qu'on consulte debout dans une salle, sur un forfait camerounais, ne peut
 * pas payer cent kilo-octets de mesure avant de montrer un solde de jetons.
 *
 * Il respecte aussi le signal « ne pas me pister » du navigateur. Mesurer
 * l'audience est légitime ; passer outre un refus explicite ne l'est pas.
 */
export function Analytique({ config }: { config: ConfigFirebase | null }) {
  const pathname = usePathname();
  const pret = useRef<((chemin: string) => void) | null>(null);
  const enAttente = useRef<string | null>(null);

  useEffect(() => {
    if (!config?.measurementId) return;

    const refuse =
      navigator.doNotTrack === "1" ||
      (window as Window & { doNotTrack?: string }).doNotTrack === "1";
    if (refuse) return;

    let vivant = true;

    void (async () => {
      try {
        const [{ getApp, getApps, initializeApp }, analytique] = await Promise.all([
          import("firebase/app"),
          import("firebase/analytics"),
        ]);
        if (!vivant || !(await analytique.isSupported())) return;

        const app = getApps().length ? getApp() : initializeApp(config);
        const mesure = analytique.getAnalytics(app);

        pret.current = (chemin) => analytique.logEvent(mesure, "page_view", { page_path: chemin });
        // La première page a pu s'afficher avant que le SDK n'arrive.
        pret.current(enAttente.current ?? window.location.pathname);
      } catch {
        // Un bloqueur de publicité, un réseau coupé : la mesure n'est pas
        // une fonctionnalité, son échec ne doit rien interrompre.
      }
    })();

    return () => {
      vivant = false;
    };
  }, [config]);

  useEffect(() => {
    if (pret.current) pret.current(pathname);
    else enAttente.current = pathname;
  }, [pathname]);

  return null;
}
