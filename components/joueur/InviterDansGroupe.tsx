"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { PlusIcon } from "@/components/icons";
import { inviterAuGroupe } from "@/lib/actions";
import { cn } from "@/lib/cn";

/**
 * Inviter dans sa bande un joueur qu'on ne connaît pas encore.
 *
 * On repère quelqu'un au classement, on ouvre sa fiche, on l'invite. L'amitié
 * n'est pas un préalable : c'est justement ainsi qu'un groupe se recrute. Rien
 * ne se fait dans son dos pour autant — l'invitation attend sa réponse, comme
 * toutes les autres.
 */
export function InviterDansGroupe({
  joueurId,
  nom,
  groupes,
}: {
  joueurId: string;
  nom: string;
  groupes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [ouvert, setOuvert] = useState(false);
  const [pending, start] = useTransition();

  if (groupes.length === 0) return null;

  function inviter(crewId: string, groupe: string) {
    start(async () => {
      const fd = new FormData();
      fd.set("crewId", crewId);
      fd.set("mode", "choisis");
      fd.append("ids", joueurId);
      const res = await inviterAuGroupe(fd);
      if (!res.ok) {
        notify("Impossible", { detail: res.error, tone: "warn" });
        return;
      }
      setOuvert(false);
      notify(`${nom} est invité`, { detail: `Dans ${groupe} — il lui reste à accepter.`, tone: "jade" });
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="press flex h-11 items-center justify-center gap-2 rounded-full border border-line px-4 text-[13px] font-semibold text-dim transition hover:text-ink"
      >
        <PlusIcon size={15} /> Inviter dans ma bande
      </button>

      <Sheet open={ouvert} onClose={() => setOuvert(false)} title={`Inviter ${nom}`}>
        <div className="flex flex-col gap-2">
          <p className="text-[12.5px] text-muted">
            Choisis la bande. {nom} recevra l&apos;invitation et décidera lui-même.
          </p>
          {groupes.map((g) => (
            <button
              key={g.id}
              onClick={() => inviter(g.id, g.name)}
              disabled={pending}
              className={cn(
                "press flex h-12 items-center justify-between gap-3 rounded-panel border border-line px-4 text-[13.5px] transition hover:bg-surface-2",
                pending && "opacity-60",
              )}
            >
              {g.name}
              {pending ? <Spinner size={14} /> : <PlusIcon size={15} className="text-muted" />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
