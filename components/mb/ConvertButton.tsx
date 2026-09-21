"use client";

import { useTransition } from "react";
import { useSnackbar } from "@/components/ui/Snackbar";
import { Spinner } from "@/components/ui/Spinner";
import { convertPoints } from "@/lib/actions";
import { POINTS_PER_FREE_TOKEN } from "@/lib/constants";

export function ConvertButton({ points }: { points: number }) {
  const { notify } = useSnackbar();
  const [pending, startTransition] = useTransition();
  const enough = points >= POINTS_PER_FREE_TOKEN;

  return (
    <button
      disabled={!enough || pending}
      onClick={() =>
        startTransition(async () => {
          const result = await convertPoints();
          if (result.ok) notify("1 jeton ajouté", { detail: `Solde de points : ${result.points}` });
          else notify("Conversion impossible", { detail: result.error, tone: "warn" });
        })
      }
      className="press flex h-11 items-center gap-2 rounded-full bg-gold px-4 text-[13px] font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-40"
    >
      {pending ? <Spinner size={15} /> : null}
      {pending ? "En cours" : "Convertir"}
    </button>
  );
}
