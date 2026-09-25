"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { BellIcon } from "@/components/icons";
import { annoncerLeCours } from "@/lib/actions";

/**
 * Rappeler son cours aux joueurs.
 *
 * Un mot court, envoyé à tout le monde en notification : c'est une réclame, et
 * elle se limite d'elle-même à une par semaine côté serveur. Le prof écrit ce
 * qu'il veut ; laissé vide, le cours s'annonce avec ses propres mots — le
 * créneau, le prix, les places qui restent.
 */
export function AnnonceCours({ coursId, titre }: { coursId: string; titre: string }) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [ouvert, setOuvert] = useState(false);
  const [pending, start] = useTransition();
  const [erreur, setErreur] = useState<string>();

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="press flex h-10 items-center gap-2 rounded-full border border-line px-3.5 text-[12px] text-dim transition hover:text-ink"
      >
        <BellIcon size={14} /> Annoncer
      </button>

      <Sheet open={ouvert} onClose={() => setOuvert(false)} title={`Annoncer « ${titre} »`}>
        <form
          action={(fd) =>
            start(async () => {
              setErreur(undefined);
              fd.set("id", coursId);
              const res = await annoncerLeCours(fd);
              if (!res.ok) {
                setErreur(res.error);
                return;
              }
              setOuvert(false);
              notify("Annonce envoyée", { detail: `${res.joueurs} joueurs prévenus.`, tone: "jade" });
              router.refresh();
            })
          }
          className="flex flex-col gap-3.5"
        >
          {erreur ? (
            <p role="alert" className="shake rounded-panel border border-warn/45 bg-warn/10 px-3.5 py-2.5 text-[12px] text-warn">
              {erreur}
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Ton mot (facultatif)</span>
            <textarea
              name="message"
              rows={3}
              maxLength={180}
              placeholder="Deux places libres samedi matin, on travaille la casse."
              className="rounded-panel border border-line bg-surface px-3.5 py-3 text-[13.5px] text-ink outline-none focus:border-gold"
            />
          </label>

          <p className="text-[11.5px] leading-5 text-muted">
            Tous les joueurs recevront une notification menant à ta fiche. Une annonce par semaine et par cours —
            au-delà, on coupe les notifications, et personne n&apos;y gagne.
          </p>

          <button
            disabled={pending}
            className="press flex h-12 items-center justify-center gap-2 rounded-full bg-gold text-[14px] font-semibold text-gold-ink disabled:opacity-60"
          >
            {pending ? <Spinner size={16} /> : null}
            Envoyer l&apos;annonce
          </button>
        </form>
      </Sheet>
    </>
  );
}
