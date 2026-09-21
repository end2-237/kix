"use client";

import { useEffect, useState } from "react";

/**
 * Abonnement au flux d'un match ou du hub.
 *
 * `EventSource` se reconnecte tout seul en cas de coupure réseau — c'est
 * précisément ce qu'il faut dans une salle de billard. On garde le dernier état
 * reçu ; tant qu'il n'y en a pas, on affiche celui rendu par le serveur.
 */
export function useLive<T>(url: string, initial: T): { data: T; connected: boolean } {
  const [data, setData] = useState<T>(initial);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(url);

    source.addEventListener("open", () => setConnected(true));
    source.addEventListener("error", () => setConnected(false));
    source.addEventListener("state", (event) => {
      setConnected(true);
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        if (payload !== null) setData(payload as T);
      } catch {
        /* charge utile illisible : on garde l'état précédent */
      }
    });

    return () => source.close();
  }, [url]);

  return { data, connected };
}
