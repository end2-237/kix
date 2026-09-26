"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { BellIcon, CheckIcon } from "@/components/icons";
import { suivreDiffuseur } from "@/lib/actions";
import { cn } from "@/lib/cn";

/**
 * Suivre un diffuseur.
 *
 * Deux états seulement, et le bouton dit ce qu'il fera : « Suivre », puis
 * « Suivi » qui se change en « Ne plus suivre » quand la souris passe. Pas de
 * demande à envoyer, pas de réponse à attendre — ce n'est pas l'amitié.
 */
export function Suivre({
  hostId,
  nom,
  suivi,
  abonnes,
  compact = false,
}: {
  hostId: string;
  nom: string;
  suivi: boolean;
  abonnes: number;
  /** Sur la page d'un direct, le bouton se range à côté du titre. */
  compact?: boolean;
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [pending, start] = useTransition();

  const basculer = () =>
    start(async () => {
      const res = await suivreDiffuseur(hostId, suivi);
      if (!res.ok) {
        notify("Impossible", { detail: res.error, tone: "warn" });
        return;
      }
      notify(suivi ? `Tu ne suis plus ${nom}` : `Tu suis ${nom}`, {
        detail: suivi ? undefined : "Tu seras prévenu quand sa caméra s'allume.",
        tone: suivi ? undefined : "jade",
      });
      router.refresh();
    });

  return (
    <button
      onClick={basculer}
      disabled={pending}
      className={cn(
        "press group flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:opacity-50",
        compact ? "h-9 px-4 text-[12.5px]" : "h-11 px-5 text-[13px]",
        suivi
          ? "border border-line text-muted hover:border-warn/50 hover:text-warn"
          : "bg-gold text-gold-ink hover:brightness-105",
      )}
    >
      {pending ? <Spinner size={15} /> : suivi ? <CheckIcon size={15} /> : <BellIcon size={15} />}
      {suivi ? (
        <>
          <span className="group-hover:hidden">Suivi</span>
          <span className="hidden group-hover:inline">Ne plus suivre</span>
        </>
      ) : (
        "Suivre"
      )}
      {abonnes > 0 ? (
        <span className={cn("tabular-nums", suivi ? "text-faint" : "text-gold-ink/70")}>· {abonnes}</span>
      ) : null}
    </button>
  );
}
