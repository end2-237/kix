"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { TargetIcon } from "@/components/icons";
import { defier } from "@/lib/actions";
import { MODES_OPTIONS, type Mode } from "@/lib/regles";
import { DISCIPLINES } from "@/lib/tournois";

/**
 * Défier un joueur depuis sa fiche.
 *
 * Trois choses à dire, pas une de plus : où, à quoi, et un mot. Le jeton du
 * défieur n'est engagé qu'à l'acceptation — on le rappelle ici, parce qu'un
 * engagement qu'on découvre après coup n'en est pas un.
 */
export function Defier({
  joueurId,
  nom,
  salles,
  jetons,
  defiEnCours,
}: {
  joueurId: string;
  nom: string;
  salles: { id: string; name: string }[];
  jetons: number;
  /** Un défi vit déjà entre nous : on ne propose pas d'en ouvrir un second. */
  defiEnCours: boolean;
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<Mode>("seche");
  const [pending, start] = useTransition();
  const [erreur, setErreur] = useState<string>();

  if (defiEnCours) {
    return (
      <span className="flex h-11 items-center justify-center rounded-full border border-gold/45 bg-gold/10 text-[13px] font-semibold text-gold-text">
        Un défi vous attend
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="press flex h-11 items-center justify-center gap-2 rounded-full bg-gold text-[13px] font-semibold text-gold-ink transition hover:brightness-105"
      >
        <TargetIcon size={16} /> Défier {nom.split(" ")[0]}
      </button>

      <Sheet open={ouvert} onClose={() => setOuvert(false)} title={`Défier ${nom}`}>
        <form
          action={(fd) =>
            start(async () => {
              setErreur(undefined);
              fd.set("toId", joueurId);
              fd.set("mode", mode);
              const res = await defier(fd);
              if (!res.ok) {
                setErreur(res.error);
                return;
              }
              setOuvert(false);
              notify("Défi envoyé", { detail: `${nom} peut accepter ou proposer une autre salle.`, tone: "jade" });
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

          <Champ label="Où jouer">
            <select
              name="venueId"
              className="h-12 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink outline-none focus:border-gold"
            >
              {salles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Champ>

          <Champ label="Discipline">
            <select
              name="kind"
              className="h-12 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink outline-none focus:border-gold"
            >
              {Object.entries(DISCIPLINES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Champ>

          <Champ label="Jeu">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="h-12 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink outline-none focus:border-gold"
            >
              {MODES_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Champ>

          {mode === "course" ? (
            <Champ label="Parties gagnantes">
              <input
                name="target"
                type="number"
                min={2}
                defaultValue={5}
                className="h-12 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink outline-none focus:border-gold"
              />
            </Champ>
          ) : null}

          <Champ label="Un mot (facultatif)">
            <input
              name="message"
              maxLength={200}
              placeholder="Ce soir vers 20h ?"
              className="h-12 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink outline-none focus:border-gold"
            />
          </Champ>

          <p className="text-[11.5px] leading-5 text-muted">
            Un de tes jetons est engagé, et seulement s&apos;il accepte — il t&apos;en reste {jetons}. Il peut
            aussi proposer une autre salle.
          </p>

          <button
            disabled={pending}
            className="press flex h-12 items-center justify-center gap-2 rounded-full bg-gold text-[14px] font-semibold text-gold-ink disabled:opacity-60"
          >
            {pending ? <Spinner size={16} /> : <TargetIcon size={17} />}
            Envoyer le défi
          </button>
        </form>
      </Sheet>
    </>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-caps text-[10px]">{label}</span>
      {children}
    </label>
  );
}
