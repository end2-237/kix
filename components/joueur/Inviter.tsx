"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { BoltIcon, CheckIcon, PinIcon, UserIcon } from "@/components/icons";
import { inviterAJouer, repondreInvitation } from "@/lib/actions";
import { cn } from "@/lib/cn";

export type AmiCochable = { id: string; name: string };
export type GroupeChoix = { id: string; name: string };
export type SalleChoix = { id: string; name: string };

/**
 * « Rejoins-moi, je joue. »
 *
 * Le geste le plus simple d'une salle de billard, et celui qui manquait. Le
 * message est prérempli avec ce que l'application sait déjà — la partie en
 * cours, la salle — pour qu'inviter quatre amis coûte deux touches.
 *
 * On coche des amis, ou on choisit un groupe entier. Les deux ensemble
 * marchent aussi : le groupe apporte ses membres, les cases en ajoutent.
 */
export function Inviter({
  amis,
  groupes,
  salles,
  salleEnCours,
  matchEnCours,
}: {
  amis: AmiCochable[];
  groupes: GroupeChoix[];
  salles: SalleChoix[];
  salleEnCours?: { id: string; name: string } | null;
  matchEnCours?: string | null;
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [ouvert, setOuvert] = useState(false);
  const [pending, start] = useTransition();
  const [erreur, setErreur] = useState<string>();
  const [groupe, setGroupe] = useState("");

  const aQuiParler = amis.length > 0 || groupes.length > 0;

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        disabled={!aQuiParler}
        className="press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-45"
      >
        <BoltIcon size={17} />
        {aQuiParler ? "Inviter à me rejoindre" : "Ajoute un ami pour inviter"}
      </button>

      <Sheet open={ouvert} onClose={() => setOuvert(false)} title="Rejoins-moi">
        <form
          action={(fd) =>
            start(async () => {
              setErreur(undefined);
              const res = await inviterAJouer(fd);
              if (!res.ok) {
                setErreur(res.error);
                return;
              }
              setOuvert(false);
              notify(
                res.envoyees > 1 ? `${res.envoyees} invitations envoyées` : "Invitation envoyée",
                { tone: "jade" },
              );
              router.refresh();
            })
          }
          className="flex flex-col gap-3.5"
        >
          {matchEnCours ? <input type="hidden" name="matchId" value={matchEnCours} /> : null}

          {salleEnCours ? (
            <Card tone="gold" shape="panel" className="flex items-center gap-2.5 p-3.5">
              <PinIcon size={15} className="shrink-0 text-gold-text" />
              <span className="text-[12.5px]">
                Tu joues au <strong>{salleEnCours.name}</strong> — c&apos;est là qu&apos;on les attend.
              </span>
              <input type="hidden" name="venueId" value={salleEnCours.id} />
            </Card>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="label-caps text-[10px]">Où ?</span>
              <select
                name="venueId"
                defaultValue=""
                className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink"
              >
                <option value="">Sans lieu précis</option>
                {salles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {groupes.length > 0 ? (
            <label className="flex flex-col gap-1.5">
              <span className="label-caps text-[10px]">Tout un groupe</span>
              <select
                name="crewId"
                value={groupe}
                onChange={(e) => setGroupe(e.target.value)}
                className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink"
              >
                <option value="">Personne en particulier</option>
                {groupes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {amis.length > 0 ? (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="label-caps pb-1.5 text-[10px]">
                {groupe ? "Et en plus" : "Qui invites-tu ?"}
              </legend>
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {amis.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2.5 rounded-full border border-line px-3.5 py-2 text-[13px]"
                  >
                    <input type="checkbox" name="amis" value={a.id} className="h-4 w-4 accent-[var(--mb-accent)]" />
                    <UserIcon size={14} className="shrink-0 text-muted" />
                    <span className="truncate">{a.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10px]">Un mot</span>
            <input
              name="message"
              maxLength={200}
              placeholder="On garde la table jusqu'à 22 h"
              className="h-11 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink placeholder:text-faint"
            />
          </label>

          {erreur ? <p className="text-[12.5px] text-warn">{erreur}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="press flex h-12 items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-50"
          >
            {pending ? <Spinner size={16} /> : <BoltIcon size={17} />}
            {pending ? "Envoi…" : "Envoyer"}
          </button>
        </form>
      </Sheet>
    </>
  );
}

/** Répondre à une invitation reçue. */
export function ReponseInvitation({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [pending, start] = useTransition();

  if (status !== "envoyee") {
    return (
      <span className={cn("shrink-0 text-[11.5px]", status === "acceptee" ? "text-jade-text" : "text-muted")}>
        {status === "acceptee" ? "tu y vas" : "décliné"}
      </span>
    );
  }

  const faire = (reponse: "acceptee" | "refusee") =>
    start(async () => {
      const res = await repondreInvitation(id, reponse);
      if (!res.ok) {
        notify("Impossible", { detail: res.error, tone: "warn" });
        return;
      }
      notify(reponse === "acceptee" ? "On t'attend" : "Invitation déclinée", {
        tone: reponse === "acceptee" ? "jade" : undefined,
      });
      router.refresh();
    });

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={() => faire("acceptee")}
        disabled={pending}
        className="press flex h-9 items-center gap-1.5 rounded-full bg-gold px-3.5 text-[12px] font-semibold text-gold-ink disabled:opacity-50"
      >
        {pending ? <Spinner size={13} /> : <CheckIcon size={13} />} J&apos;arrive
      </button>
      <button
        onClick={() => faire("refusee")}
        disabled={pending}
        className="press flex h-9 items-center rounded-full border border-line px-3 text-[12px] text-muted hover:text-ink disabled:opacity-50"
      >
        Pas ce soir
      </button>
    </div>
  );
}
