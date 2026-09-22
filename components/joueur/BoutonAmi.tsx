"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, PlusIcon, UserIcon } from "@/components/icons";
import { demanderAmi, repondreAmi } from "@/lib/actions";
import type { LienAmitie } from "@/lib/joueurs";
import { cn } from "@/lib/cn";

/**
 * Le bouton d'ami, dans ses quatre états.
 *
 * Il dit toujours ce qui se passera si on le touche, jamais l'état où l'on
 * est : « Ajouter », « Accepter », « Demande envoyée ». Un bouton qui affiche
 * un état laisse croire qu'il reste quelque chose à faire.
 */
export function BoutonAmi({
  autreId,
  nom,
  etat,
  lienId,
}: {
  autreId: string;
  nom: string;
  etat: LienAmitie;
  lienId?: string;
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [pending, start] = useTransition();

  const faire = (action: () => Promise<{ ok: boolean; error?: string }>, succes: string) =>
    start(async () => {
      const res = await action();
      if (!res.ok) {
        notify("Impossible", { detail: res.error, tone: "warn" });
        return;
      }
      notify(succes, { tone: "jade" });
      router.refresh();
    });

  const base =
    "press flex h-11 items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition disabled:opacity-50";

  if (etat === "amis") {
    return (
      <div className="flex gap-2">
        <span className={cn(base, "grow border border-gold/45 bg-gold/15 text-gold-text")}>
          <CheckIcon size={16} /> Vous êtes amis
        </span>
        <button
          onClick={() => lienId && faire(() => repondreAmi(lienId, "retirer"), "Ami retiré")}
          disabled={pending}
          className={cn(base, "shrink-0 border border-line px-4 text-muted hover:text-ink")}
        >
          {pending ? <Spinner size={14} /> : null} Retirer
        </button>
      </div>
    );
  }

  if (etat === "recue" && lienId) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => faire(() => repondreAmi(lienId, "acceptee"), `Tu es ami avec ${nom}`)}
          disabled={pending}
          className={cn(base, "grow bg-gold text-gold-ink hover:brightness-105")}
        >
          {pending ? <Spinner size={15} /> : <CheckIcon size={16} />} Accepter
        </button>
        <button
          onClick={() => faire(() => repondreAmi(lienId, "refusee"), "Demande écartée")}
          disabled={pending}
          className={cn(base, "shrink-0 border border-line px-4 text-muted hover:text-ink")}
        >
          Refuser
        </button>
      </div>
    );
  }

  if (etat === "envoyee") {
    return (
      <div className="flex gap-2">
        <span className={cn(base, "grow border border-line text-muted")}>Demande envoyée</span>
        <button
          onClick={() => lienId && faire(() => repondreAmi(lienId, "retirer"), "Demande annulée")}
          disabled={pending}
          className={cn(base, "shrink-0 border border-line px-4 text-muted hover:text-ink")}
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => faire(() => demanderAmi(autreId), `Demande envoyée à ${nom}`)}
      disabled={pending}
      className={cn(base, "w-full bg-gold text-gold-ink hover:brightness-105")}
    >
      {pending ? <Spinner size={15} /> : <PlusIcon size={16} />}
      <UserIcon size={15} />
      Ajouter en ami
    </button>
  );
}
