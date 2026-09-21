"use client";

import { useEffect, useRef, useState } from "react";
import { group, pad2 } from "@/lib/format";

type Format = "plain" | "grouped" | "pad2";

const formatters: Record<Format, (n: number) => string> = {
  plain: (n) => String(n),
  grouped: group,
  pad2,
};

/**
 * Compteur qui monte jusqu'à sa valeur au montage. Le rendu serveur affiche
 * déjà la valeur finale : aucun décalage d'hydratation, aucun chiffre faux.
 */
export function Counter({
  value,
  format = "plain",
  duration = 900,
  animateOnMount = true,
  className,
}: {
  value: number;
  format?: Format;
  duration?: number;
  /** Un solde doit être juste tout de suite : on n'anime alors que ses changements. */
  animateOnMount?: boolean;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);

  const mounted = useRef(false);

  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (first && !animateOnMount) {
      previous.current = value;
      return;
    }

    const from = previous.current === value ? 0 : previous.current;
    previous.current = value;

    let raf = 0;

    // moins d'animations demandé : on saute directement à la valeur
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(raf);
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, animateOnMount]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatters[format](shown)}
    </span>
  );
}
