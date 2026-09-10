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
      <span className="flex items-center gap-2 rounded-full border border-green/35 bg-green/15 px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-green-text">
        <span className="h-1.5 w-1.5 rounded-full bg-green" />
        JETON {index + 1} / {tokens.length} — PRÊT À SCANNER
      </span>

      <div className="rounded-panel bg-white p-3 shadow-[0_0_40px_rgba(61,240,138,0.22)]">
        <QrCode shape={token.shape} size={196} />
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
              className={cn("h-1 rounded-full transition", i === index ? "w-4 bg-green" : "w-1.5 bg-line-strong")}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted">{token.venue}</span>
      </div>
    </div>
  );
}
