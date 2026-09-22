"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { creerGroupe, modifierGroupe, rejoindreGroupe } from "@/lib/actions";
import { ChampImage } from "@/components/joueur/ChampImage";

export type SalleChoix = { id: string; name: string };

/**
 * Créer ou modifier un groupe.
 *
 * Un nom et une photo suffisent à faire exister une bande. Le reste — la
 * devise, la salle du jeudi — se remplit ou non ; on ne bloque personne sur
 * un formulaire pour avoir le droit de se donner un nom.
 */
export function FormulaireGroupe({
  salles,
  groupe,
}: {
  salles: SalleChoix[];
  groupe?: { id: string; name: string; image: string; devise: string; venueId: string | null };
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [ouvert, setOuvert] = useState(false);
  const [pending, start] = useTransition();
  const [erreur, setErreur] = useState<string>();

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className={
          groupe
            ? "press flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[12.5px] text-dim hover:text-ink"
            : "press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105"
        }
      >
        {groupe ? "Modifier le groupe" : (<><PlusIcon size={16} /> Créer un groupe</>)}
      </button>

      <Sheet
        open={ouvert}
        onClose={() => setOuvert(false)}
        title={groupe ? "Modifier le groupe" : "Nouveau groupe"}
      >
        <form
          action={(fd) =>
            start(async () => {
              setErreur(undefined);
              const res = groupe ? await modifierGroupe(fd) : await creerGroupe(fd);
              if (!res.ok) {
                setErreur(res.error);
                return;
              }
              setOuvert(false);
              notify(groupe ? "Groupe modifié" : "Groupe créé", { tone: "jade" });
              if (!groupe && "slug" in res) router.push(`/app/groupes/${res.slug}`);
              else router.refresh();
            })
          }
          className="flex flex-col gap-3.5"
        >
          {groupe ? <input type="hidden" name="id" value={groupe.id} /> : null}

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Nom du groupe</span>
            <input
              name="name"
              defaultValue={groupe?.name}
              maxLength={50}
              required
              placeholder="Les Requins d'Akwa"
              className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink placeholder:text-faint"
            />
          </label>

          <ChampImage name="image" defaultValue={groupe?.image ?? ""} />

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Devise</span>
            <input
              name="devise"
              defaultValue={groupe?.devise}
              maxLength={120}
              placeholder="On ne pousse pas la bille, on la joue."
              className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink placeholder:text-faint"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Salle de la bande</span>
            <select
              name="venueId"
              defaultValue={groupe?.venueId ?? ""}
              className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink"
            >
              <option value="">Pas de salle attitrée</option>
              {salles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {erreur ? <p className="text-[12.5px] text-warn">{erreur}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="press flex h-12 items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-50"
          >
            {pending ? <Spinner size={16} /> : <CheckIcon size={17} />}
            {groupe ? "Enregistrer" : "Créer le groupe"}
          </button>
        </form>
      </Sheet>
    </>
  );
}

/** Rejoindre la bande, ou la quitter. */
export function BoutonGroupe({ crewId, membre, chef }: { crewId: string; membre: boolean; chef: boolean }) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [pending, start] = useTransition();

  if (chef) {
    return (
      <span className="flex h-11 items-center justify-center gap-2 rounded-full border border-gold/45 bg-gold/15 px-4 text-[13px] font-semibold text-gold-text">
        Tu es le chef
      </span>
    );
  }

  return (
    <button
      onClick={() =>
        start(async () => {
          const res = await rejoindreGroupe(crewId, membre);
          if (!res.ok) notify("Impossible", { detail: res.error, tone: "warn" });
          else {
            notify(membre ? "Tu as quitté le groupe" : "Bienvenue dans la bande", {
              tone: membre ? undefined : "jade",
            });
            router.refresh();
          }
        })
      }
      disabled={pending}
      className={
        membre
          ? "press flex h-11 items-center justify-center gap-2 rounded-full border border-line px-4 text-[13px] text-muted hover:text-ink disabled:opacity-50"
          : "press flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-[13px] font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-50"
      }
    >
      {pending ? <Spinner size={15} /> : null}
      {membre ? "Quitter le groupe" : "Rejoindre"}
    </button>
  );
}
