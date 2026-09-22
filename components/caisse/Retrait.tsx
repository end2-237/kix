"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CoinIcon } from "@/components/icons";
import { demanderRetrait, traiterRetrait } from "@/lib/actions";
import { displayPhone } from "@/lib/phone";
import { f, fcfa } from "@/lib/format";

const MOYENS = [
  { value: "momo", label: "MTN Mobile Money" },
  { value: "om", label: "Orange Money" },
  { value: "especes", label: "Espèces au comptoir" },
  { value: "virement", label: "Virement bancaire" },
];

/**
 * Demander un versement.
 *
 * Le montant est proposé au maximum disponible : c'est ce que le gérant veut
 * neuf fois sur dix, et taper un nombre à six chiffres sur un téléphone est
 * la meilleure façon de se tromper d'un zéro.
 */
export function DemandeRetrait({
  disponible,
  minimum,
  phone,
  venueId,
}: {
  disponible: number;
  minimum: number;
  phone: string;
  venueId?: string;
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [ouvert, setOuvert] = useState(false);
  const [pending, start] = useTransition();
  const [erreur, setErreur] = useState<string>();

  const possible = disponible >= minimum;

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        disabled={!possible}
        className="press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-45"
      >
        <CoinIcon size={17} />
        {possible ? `Retirer jusqu'à ${fcfa(disponible)}` : `Minimum ${f(minimum)} pour retirer`}
      </button>

      <Sheet open={ouvert} onClose={() => setOuvert(false)} title="Demander un versement">
        <form
          action={(fd) =>
            start(async () => {
              setErreur(undefined);
              const res = await demanderRetrait(fd);
              if (!res.ok) {
                setErreur(res.error);
                return;
              }
              setOuvert(false);
              notify("Demande envoyée", { detail: "L'administration la traite sous peu.", tone: "jade" });
              router.refresh();
            })
          }
          className="flex flex-col gap-3.5"
        >
          {venueId ? <input type="hidden" name="venueId" value={venueId} /> : null}

          <Card tone="gold" shape="panel" className="flex items-baseline justify-between gap-3 p-3.5">
            <span className="text-[12px] text-muted">Disponible</span>
            <span className="text-[20px] font-bold tracking-[-0.03em]">{fcfa(disponible)}</span>
          </Card>

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Montant (F)</span>
            {/* Pas de `step` : un solde vaut rarement un multiple rond, et le
                montant proposé par défaut — le maximum disponible — se serait
                trouvé invalide. Le navigateur refusait alors l'envoi sans rien
                dire d'utile, et le bouton semblait mort. */}
            <input
              name="amount"
              type="number"
              min={minimum}
              max={disponible}
              step={1}
              defaultValue={disponible}
              required
              className="h-12 rounded-full border border-line bg-surface px-4 text-[15px] font-semibold text-ink tabular-nums"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Moyen</span>
            <select
              name="method"
              defaultValue="momo"
              className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink"
            >
              {MOYENS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Numéro à créditer</span>
            <input
              name="phone"
              defaultValue={displayPhone(phone)}
              inputMode="tel"
              className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Un mot pour l&apos;administration</span>
            <textarea
              name="note"
              rows={2}
              maxLength={300}
              className="rounded-panel border border-line bg-surface px-4 py-3 text-[13.5px] text-ink"
            />
          </label>

          {erreur ? <p className="text-[12.5px] text-warn">{erreur}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="press flex h-12 items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-50"
          >
            {pending ? <Spinner size={16} /> : <CoinIcon size={17} />}
            {pending ? "Envoi…" : "Envoyer la demande"}
          </button>

          <p className="text-[11.5px] leading-5 text-muted">
            Les versements partent du compte Master Break. Le montant demandé est retenu sur ton solde tant
            que la demande n&apos;est pas traitée.
          </p>
        </form>
      </Sheet>
    </>
  );
}

/** Les décisions de l'administration sur une demande. */
export function TraiterRetrait({ id }: { id: string }) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [pending, start] = useTransition();
  const [reference, setReference] = useState("");

  const faire = (decision: "paye" | "refuse") =>
    start(async () => {
      const res = await traiterRetrait(id, decision, reference);
      if (!res.ok) {
        notify("Impossible", { detail: res.error, tone: "warn" });
        return;
      }
      notify(decision === "paye" ? "Versement enregistré" : "Demande refusée", { tone: "jade" });
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Référence de l'envoi"
        className="h-9 min-w-40 grow rounded-none border border-line bg-surface px-3 text-[12px] text-ink"
      />
      <button
        onClick={() => faire("paye")}
        disabled={pending}
        className="press flex h-9 items-center gap-1.5 rounded-full bg-gold px-3.5 text-[12px] font-semibold text-gold-ink disabled:opacity-50"
      >
        {pending ? <Spinner size={13} /> : null} Marquer versé
      </button>
      <button
        onClick={() => faire("refuse")}
        disabled={pending}
        className="press flex h-9 items-center rounded-full border border-line px-3.5 text-[12px] text-muted hover:text-ink disabled:opacity-50"
      >
        Refuser
      </button>
    </div>
  );
}
