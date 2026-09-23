"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, TrophyIcon } from "@/components/icons";
import { FORMULES } from "@/lib/formules";
import { cn } from "@/lib/cn";

/**
 * Les formules, au-dessus du formulaire.
 *
 * Toucher « Utiliser » remplit les champs du formulaire voisin — discipline,
 * format, tableau, parties gagnantes, dotation, partage, règlement, horaires,
 * billetterie. Le titre, le droit d'inscription, la salle et les dates ne sont
 * jamais touchés : ce sont les seules choses qu'une formule ne peut pas
 * deviner.
 *
 * Les champs du formulaire ne sont pas contrôlés par React — ils portent un
 * `defaultValue` —, on peut donc y écrire directement. C'est aussi ce qui
 * permet à l'organisateur de tout reprendre ensuite, champ par champ.
 */
export function Formules({ cible }: { cible: string }) {
  const { notify } = useSnackbar();
  const [posee, setPosee] = useState<string | null>(null);

  function appliquer(cle: string) {
    const formule = FORMULES.find((f) => f.cle === cle);
    const form = document.querySelector<HTMLFormElement>(`form[data-formulaire="${cible}"]`);
    if (!formule || !form) return;

    for (const [nom, valeur] of Object.entries(formule.champs)) {
      const champ = form.elements.namedItem(nom);
      if (
        champ instanceof HTMLInputElement ||
        champ instanceof HTMLSelectElement ||
        champ instanceof HTMLTextAreaElement
      ) {
        champ.value = valeur;
      }
    }

    setPosee(cle);
    notify(`Formule « ${formule.nom} »`, { detail: "Tout est posé — à toi le titre et le droit d'inscription.", tone: "jade" });
    form.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="label-caps text-[10.5px] text-muted">Partir d&apos;une formule</span>
        <p className="text-[12px] text-muted">
          Elle pose le format, le tableau, la dotation et le règlement. Le titre et le droit
          d&apos;inscription restent à toi.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {FORMULES.map((f) => (
          <Card
            key={f.cle}
            tone={posee === f.cle ? "gold" : "glass"}
            shape="panel"
            className="flex flex-col gap-2 p-3.5"
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                  posee === f.cle ? "bg-gold text-gold-ink" : "bg-surface-2 text-muted",
                )}
              >
                {posee === f.cle ? <CheckIcon size={15} /> : <TrophyIcon size={15} />}
              </span>
              <span className="text-[13.5px] font-semibold">{f.nom}</span>
            </span>

            <p className="text-[11.5px] leading-4 text-muted">{f.pitch}</p>

            <ul className="flex flex-col gap-0.5">
              {f.reperes.map((r) => (
                <li key={r} className="text-[11px] text-dim">
                  · {r}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => appliquer(f.cle)}
              className={cn(
                "press mt-auto h-10 rounded-full text-[12.5px] font-semibold transition",
                posee === f.cle
                  ? "border border-gold/45 bg-gold/15 text-gold-text"
                  : "bg-gold text-gold-ink hover:brightness-105",
              )}
            >
              {posee === f.cle ? "Formule posée" : "Utiliser ce set"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
