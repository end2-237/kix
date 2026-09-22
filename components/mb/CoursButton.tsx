"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MomoCheckout, type Method } from "@/components/mb/MomoCheckout";
import { Sheet } from "@/components/ui/Sheet";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, TargetIcon } from "@/components/icons";
import { startEnrollment } from "@/lib/actions";
import { fcfa } from "@/lib/format";

/**
 * S'inscrire à un cours.
 *
 * Les places sont recomptées à la confirmation du paiement, pas ici : un cours
 * peut se remplir pendant qu'un élève valide sur son téléphone, et il vaut
 * mieux refuser à ce moment-là — avec le remboursement qui va avec — que de
 * vendre une place qui n'existe plus.
 */
export function CoursButton({
  courseId,
  titre,
  price,
  phone,
  sessions,
  inscrit = false,
  complet = false,
}: {
  courseId: string;
  titre: string;
  price: number;
  phone: string;
  sessions: number;
  inscrit?: boolean;
  complet?: boolean;
}) {
  const { notify } = useSnackbar();
  const router = useRouter();
  const [pris, setPris] = useState(inscrit);
  const [open, setOpen] = useState(false);

  const start = async (phoneNumber: string, method: Method) => {
    const res = await startEnrollment(courseId, method, phoneNumber);
    if (!res.ok) return res;
    return { ok: true as const, reference: res.reference, instruction: res.instruction };
  };

  function onPaid() {
    setOpen(false);
    setPris(true);
    notify("Inscription confirmée", { detail: `${titre} · ${fcfa(price)}`, tone: "jade" });
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted">
            {sessions > 1 ? `Forfait ${sessions} séances` : "Séance"}
          </span>
          <span className="text-xl font-bold tracking-[-0.03em]">{fcfa(price)}</span>
        </div>

        <button
          onClick={() => (pris ? router.push("/app/cours") : setOpen(true))}
          disabled={complet && !pris}
          className={
            pris
              ? "pop press flex h-12 grow items-center justify-center gap-2 rounded-full border border-gold/45 bg-gold/15 text-sm font-semibold text-gold-text"
              : "press flex h-12 grow items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-45"
          }
        >
          {pris ? <CheckIcon size={18} /> : <TargetIcon size={18} />}
          {pris ? "Tu es inscrit" : complet ? "Cours complet" : "M'inscrire"}
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={titre}>
        <MomoCheckout
          amount={price}
          defaultPhone={phone}
          start={start}
          onPaid={onPaid}
          hint={sessions > 1 ? `${sessions} séances avec ton coach` : "Une séance avec ton coach"}
          label={`Payer mon inscription · ${fcfa(price)}`}
        />
      </Sheet>
    </>
  );
}
