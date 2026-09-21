"use client";

import { useEffect, useState } from "react";
import { QrCode } from "@/components/mb/QrCode";
import { rotatePass } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { clockFrom } from "@/lib/format";
import { ClockIcon } from "@/components/icons";
import type { QrShape } from "@/lib/qr";

export type WalletToken = { id: string; code: string; venue: string; shape: QrShape };

/**
 * Durée de vie d'un laissez-passer, côté serveur comme à l'écran (lib/pass.ts).
 * Passé ce délai le QR affiché est refusé au comptoir : il faut le renouveler.
 */
const CYCLE = 90;

export function PassWallet({ tokens: initial }: { tokens: WalletToken[] }) {
  // Les QR renouvelés vivent à part : le rendu serveur reste la source, on ne
  // garde en état que ce qui a été re-signé depuis.
  const [fresh, setFresh] = useState<WalletToken[] | null>(null);
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(CYCLE);
  const tokens = fresh ?? initial;

  // Le compte à rebours n'est pas décoratif : à zéro, on va chercher des QR
  // fraîchement signés, sinon le gérant scannerait un laissez-passer périmé.
  useEffect(() => {
    let alive = true;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        rotatePass().then((rotated) => {
          if (!alive || rotated.length === 0) return;
          setFresh((current) => {
            const known = current ?? initial;
            return rotated.map((r) => ({
              ...r,
              venue: known.find((t) => t.id === r.id)?.venue ?? known[0]?.venue ?? "",
            }));
          });
        });
        return CYCLE;
      });
    }, 1000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [initial]);

  const token = tokens[Math.min(index, tokens.length - 1)];
  if (!token) return null;

  return (
    <div className="glass flex flex-col items-center gap-3.5 rounded-panel px-5 pt-6 pb-4">
      <span className="flex items-center gap-2.5 rounded-full border border-gold/35 bg-gold/15 px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-gold-text">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-gold" />
        JETON {index + 1} / {tokens.length} — PRÊT À SCANNER
      </span>

      <div key={token.id} className="pop relative">
        {/* l'anneau se vide en même temps que le compte à rebours */}
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2.5 h-[calc(100%+20px)] w-[calc(100%+20px)]"
        >
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-line"
          />
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="14"
            fill="none"
            stroke="#D9B450"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - (left / CYCLE) * 100}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="rounded-panel bg-white p-3 shadow-[0_0_40px_rgba(217,180,80,0.22)]">
          <QrCode shape={token.shape} size={196} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium">Présente ce code au gérant</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <ClockIcon size={13} />
          Se régénère dans <span className="font-medium text-ink">{clockFrom(left)}</span>
        </span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          {tokens.slice(0, 6).map((t, i) => (
            <button
              key={t.id}
              aria-label={`Jeton ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "press h-1 rounded-full transition-all duration-300",
                i === index ? "w-5 bg-gold" : "w-1.5 bg-line-strong hover:bg-muted",
              )}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted">{token.venue}</span>
      </div>
    </div>
  );
}
