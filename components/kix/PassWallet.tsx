"use client";

import { useEffect, useState } from "react";
import { QrCode } from "@/components/kix/QrCode";
import { cn } from "@/lib/cn";
import { clockFrom } from "@/lib/format";
import { ClockIcon } from "@/components/icons";
import type { QrShape } from "@/lib/qr";

export type WalletToken = { id: string; code: string; venue: string; shape: QrShape };

const CYCLE = 300; // le QR se régénère toutes les 5 minutes

export function PassWallet({ tokens }: { tokens: WalletToken[] }) {
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(CYCLE);

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? CYCLE : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const token = tokens[Math.min(index, tokens.length - 1)];
  if (!token) return null;

  return (
    <div className="glass flex flex-col items-center gap-3.5 rounded-panel px-5 pt-6 pb-4">
      <span className="flex items-center gap-2.5 rounded-full border border-green/35 bg-green/15 px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-green-text">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-green" />
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
            stroke="#3DF08A"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - (left / CYCLE) * 100}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="rounded-panel bg-white p-3 shadow-[0_0_40px_rgba(61,240,138,0.22)]">
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
                i === index ? "w-5 bg-green" : "w-1.5 bg-line-strong hover:bg-muted",
              )}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted">{token.venue}</span>
      </div>
    </div>
  );
}
