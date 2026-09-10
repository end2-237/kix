"use client";

import { useState } from "react";
import { CheckIcon, TicketIcon } from "@/components/icons";
import { fcfa } from "@/lib/format";

export function TicketButton({ price }: { price: number }) {
  const [taken, setTaken] = useState(false);

  return (
    <div className="flex items-center gap-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-muted">Billet joueur</span>
        <span className="font-display text-xl">{fcfa(price)}</span>
      </div>
      <button
        onClick={() => setTaken(true)}
        className={
          taken
            ? "flex h-12 grow items-center justify-center gap-2 rounded-[18px] border border-green/45 bg-green/15 text-sm font-semibold text-green"
            : "flex h-12 grow items-center justify-center gap-2 rounded-[18px] bg-green text-sm font-semibold text-green-ink shadow-[0_12px_30px_rgba(61,240,138,0.28)] transition hover:brightness-105"
        }
      >
        {taken ? <CheckIcon size={18} /> : <TicketIcon size={18} />}
        {taken ? "Pass QR dans ton KIX Pass" : "Prendre mon billet"}
      </button>
    </div>
  );
}
