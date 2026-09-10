"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, TicketIcon } from "@/components/icons";
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
        notify("Billet indisponible", { detail: result.error, tone: "amber" });
        return;
      }
      setTaken(true);
      notify("Billet réservé", { detail: `Code d'entrée ${result.code}`, tone: "violet" });
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
            ? "flex h-12 grow items-center justify-center gap-2 rounded-full border border-green/45 bg-green/15 text-sm font-semibold text-green-text"
            : "flex h-12 grow items-center justify-center gap-2 rounded-full bg-green text-sm font-semibold text-green-ink transition hover:brightness-105"
        }
      >
        {taken ? <CheckIcon size={18} /> : <TicketIcon size={18} />}
        {pending ? "…" : taken ? "Voir mon billet" : "Prendre mon billet"}
      </button>
    </div>
  );
}
