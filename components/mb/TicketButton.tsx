"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, TicketIcon } from "@/components/icons";
import { Spinner } from "@/components/ui/Spinner";
import { buyTicket } from "@/lib/actions";
import { fcfa } from "@/lib/format";

export function TicketButton({
  eventId,
  price,
  owned = false,
}: {
  eventId: string;
  price: number;
  owned?: boolean;
}) {
  const { notify } = useSnackbar();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [taken, setTaken] = useState(owned);

  function take() {
    startTransition(async () => {
      const result = await buyTicket(eventId);
      if (!result.ok) {
        notify("Billet indisponible", { detail: result.error, tone: "warn" });
        return;
      }
      setTaken(true);
      notify("Billet réservé", { detail: `Code d'entrée ${result.code}`, tone: "jade" });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-muted">Billet joueur</span>
        <span className="text-xl font-bold tracking-[-0.03em]">{fcfa(price)}</span>
      </div>
      <button
        onClick={taken ? () => router.push("/app/billets") : take}
        disabled={pending}
        className={
          taken
            ? "pop press flex h-12 grow items-center justify-center gap-2 rounded-full border border-gold/45 bg-gold/15 text-sm font-semibold text-gold-text"
            : "press flex h-12 grow items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105"
        }
      >
        {pending ? <Spinner size={17} /> : taken ? <CheckIcon size={18} /> : <TicketIcon size={18} />}
        {pending ? "Réservation…" : taken ? "Voir mon billet" : "Prendre mon billet"}
      </button>
    </div>
  );
}
