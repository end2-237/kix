"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, PlusIcon, SearchIcon, UserIcon } from "@/components/icons";
import { inviterAuGroupe } from "@/lib/actions";
import { cn } from "@/lib/cn";

export type AmiInvitable = { id: string; name: string; avatar: string | null; code: string };

type Mode = "tous" | "sauf" | "choisis";

const MODES: { valeur: Mode; titre: string; detail: string }[] = [
  { valeur: "tous", titre: "Tous mes amis", detail: "D'un coup, sans rien cocher." },
  { valeur: "sauf", titre: "Tous, sauf…", detail: "Coche ceux qu'il ne faut pas inviter." },
  { valeur: "choisis", titre: "Seulement certains", detail: "Coche ceux que tu invites." },
];

/**
 * Inviter ses amis dans un groupe.
 *
 * Trois façons de désigner les gens, parce que ce sont les trois qu'on a en
 * tête devant une bande de quinze : tout le monde, tout le monde sauf untel,
 * ou une poignée choisie. « Tous sauf » évite d'avoir à cocher quatorze cases
 * pour en écarter une.
 *
 * La liste est cherchable — par le nom ou par le code à six chiffres — parce
 * qu'au-delà de dix amis, la faire défiler devient plus long que de la lire.
 */
export function InviterAuGroupe({
  crewId,
  nomDuGroupe,
  amis,
}: {
  crewId: string;
  nomDuGroupe: string;
  amis: AmiInvitable[];
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<Mode>("tous");
  const [filtre, setFiltre] = useState("");
  const [pending, start] = useTransition();
  const [erreur, setErreur] = useState<string>();

  const cherche = filtre.trim().toLowerCase();
  const visibles = cherche
    ? amis.filter((a) => a.name.toLowerCase().includes(cherche) || a.code.startsWith(cherche))
    : amis;

  if (amis.length === 0) {
    return (
      <span className="flex h-10 items-center rounded-full border border-line px-4 text-[12.5px] text-muted">
        Tous tes amis y sont déjà
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="press flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-[12.5px] font-semibold text-gold-ink transition hover:brightness-105"
      >
        <PlusIcon size={15} /> Inviter mes amis
      </button>

      <Sheet open={ouvert} onClose={() => setOuvert(false)} title={`Inviter dans ${nomDuGroupe}`}>
        <form
          action={(fd) =>
            start(async () => {
              setErreur(undefined);
              const res = await inviterAuGroupe(fd);
              if (!res.ok) {
                setErreur(res.error);
                return;
              }
              setOuvert(false);
              notify(
                res.invites > 1 ? `${res.invites} invitations envoyées` : "Invitation envoyée",
                { tone: "jade" },
              );
              router.refresh();
            })
          }
          className="flex flex-col gap-3.5"
        >
          <input type="hidden" name="crewId" value={crewId} />
          <input type="hidden" name="mode" value={mode} />

          <div className="flex flex-col gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.valeur}
                type="button"
                onClick={() => setMode(m.valeur)}
                className={cn(
                  "press flex items-start gap-2.5 rounded-panel border px-3.5 py-3 text-left transition",
                  mode === m.valeur
                    ? "border-gold/45 bg-gold/12"
                    : "border-line hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    mode === m.valeur ? "border-gold bg-gold text-gold-ink" : "border-line",
                  )}
                >
                  {mode === m.valeur ? <CheckIcon size={10} /> : null}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold">{m.titre}</span>
                  <span className="text-[11.5px] text-muted">{m.detail}</span>
                </span>
              </button>
            ))}
          </div>

          {mode !== "tous" ? (
            <>
              <label className="relative flex items-center">
                <SearchIcon size={15} className="absolute left-3.5 text-muted" />
                <input
                  value={filtre}
                  onChange={(e) => setFiltre(e.target.value)}
                  placeholder="Un nom, ou un code à six chiffres"
                  inputMode="text"
                  className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-[13px] text-ink placeholder:text-faint"
                />
              </label>

              <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                {visibles.length === 0 ? (
                  <p className="px-1 py-3 text-[12.5px] text-muted">Personne ne correspond.</p>
                ) : (
                  visibles.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-2.5 rounded-full border border-line px-3.5 py-2 text-[13px]"
                    >
                      <input type="checkbox" name="ids" value={a.id} className="h-4 w-4 accent-[var(--mb-accent)]" />
                      <UserIcon size={14} className="shrink-0 text-muted" />
                      <span className="min-w-0 grow truncate">{a.name}</span>
                      <span className="shrink-0 text-[10.5px] text-faint tabular-nums">{a.code}</span>
                    </label>
                  ))
                )}
              </div>

              <p className="text-[11.5px] text-muted">
                {mode === "sauf"
                  ? "Les cases cochées ne recevront pas l'invitation."
                  : "Seules les cases cochées la recevront."}
              </p>
            </>
          ) : (
            <p className="text-[12.5px] text-muted">
              {amis.length} ami{amis.length > 1 ? "s" : ""} recevront l&apos;invitation.
            </p>
          )}

          {erreur ? <p className="text-[12.5px] text-warn">{erreur}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="press flex h-12 items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink transition hover:brightness-105 disabled:opacity-50"
          >
            {pending ? <Spinner size={16} /> : <PlusIcon size={17} />}
            {pending ? "Envoi…" : "Envoyer les invitations"}
          </button>
        </form>
      </Sheet>
    </>
  );
}
