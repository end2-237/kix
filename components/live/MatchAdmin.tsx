"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, PlusIcon, ShareIcon, UserIcon } from "@/components/icons";
import { assignOfficial, cancelMatch, createScoringInvite, removeOfficial, setSelfScoring } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { jeuCourt, MODES, MODES_OPTIONS, type Mode } from "@/lib/regles";
import { DISCIPLINES } from "@/lib/tournois";

export type Person = { id: string; name: string; avatar: string | null };
export type MatchLine = {
  id: string;
  status: string;
  label: string;
  kind: string;
  target: number;
  scoreA: number;
  scoreB: number;
  a: Person;
  b: Person;
  table: string | null;
  officials: { id: string; name: string; scope: "match" | "event" }[];
  eventId: string | null;
};

/**
 * Le poste du gérant côté matchs : créer une rencontre, confier la feuille, et
 * suivre ce qui se joue. La création vit dans une feuille modale pour que la
 * liste reste lisible même un soir de tournoi.
 */
export function MatchAdmin({
  matches,
  players,
  selfScoring,
  venueId,
}: {
  matches: MatchLine[];
  players: Person[];
  selfScoring: boolean;
  venueId: string;
}) {
  const { notify } = useSnackbar();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [invite, setInvite] = useState<{ id: string; url: string } | null>(null);
  const [assigning, setAssigning] = useState<MatchLine | null>(null);

  const run = (label: string, fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      notify(label);
      router.refresh();
    });

  async function share(match: MatchLine, scope: "match" | "event") {
    const token = await createScoringInvite(match.id, scope);
    if (!token) return;
    const url = `${window.location.origin}/arbitre/invitation/${encodeURIComponent(token)}`;
    setInvite({ id: match.id, url });
    try {
      await navigator.clipboard.writeText(url);
      notify("Lien d'arbitrage copié", { detail: "Valable deux heures" });
    } catch {
      notify("Lien d'arbitrage prêt", { detail: "Copie-le depuis l'écran" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="glass flex items-center gap-3 rounded-card px-4 py-3.5">
        <input
          type="checkbox"
          checked={selfScoring}
          onChange={(e) => run(e.target.checked ? "Auto-arbitrage ouvert" : "Auto-arbitrage fermé", () => setSelfScoring(venueId, e.target.checked))}
          className="h-4 w-4 accent-[var(--mb-gold)]"
        />
        <span className="flex grow flex-col gap-0.5">
          <span className="text-[13px] font-semibold">Auto-arbitrage par les joueurs</span>
          <span className="text-[11.5px] text-muted">
            Les deux joueurs peuvent tenir la feuille eux-mêmes. À réserver aux matchs amicaux.
          </span>
        </span>
      </label>

      {matches.length === 0 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-8 text-center text-[13px] text-muted">
          Aucun match en cours ni programmé.
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {matches.map((m) => (
            <Card key={m.id} shape="square" className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-[14px] font-semibold">
                    {m.a.name} <span className="text-muted">vs</span> {m.b.name}
                  </span>
                  <span className="text-[11.5px] text-muted">
                    {m.label} · {m.kind} · {jeuCourt(m.target)}
                    {m.table ? ` · ${m.table}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[20px] font-bold tabular-nums">
                  {m.scoreA} – {m.scoreB}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
                <span className="label-caps text-[10px] text-muted">Feuille tenue par</span>
                {m.officials.length === 0 ? (
                  <span className="text-[11.5px] text-dim">le comptoir</span>
                ) : (
                  m.officials.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => run("Arbitre retiré", () => removeOfficial(o.id))}
                      disabled={pending}
                      title="Retirer cet arbitre"
                      className="press flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-dim transition hover:border-warn/50 hover:text-warn"
                    >
                      <UserIcon size={11} />
                      {o.name}
                      {o.scope === "event" ? " · tournoi" : ""}
                      <span aria-hidden>×</span>
                    </button>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`/arbitre/${m.id}`}
                  className="press flex h-9 items-center gap-1.5 rounded-full bg-gold px-3.5 text-[12px] font-semibold text-gold-ink"
                >
                  Marquer
                </a>
                <button
                  onClick={() => setAssigning(m)}
                  className="press flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[12px] text-dim hover:text-ink"
                >
                  <PlusIcon size={13} /> Arbitre
                </button>
                <button
                  onClick={() => share(m, "match")}
                  className="press flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[12px] text-dim hover:text-ink"
                >
                  <ShareIcon size={13} /> Lien
                </button>
                {m.eventId ? (
                  <button
                    onClick={() => share(m, "event")}
                    className="press flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[12px] text-dim hover:text-ink"
                  >
                    <ShareIcon size={13} /> Lien tournoi
                  </button>
                ) : null}
                <button
                  onClick={() => run("Match annulé", () => cancelMatch(m.id))}
                  disabled={pending}
                  className="press ml-auto h-9 rounded-full px-3 text-[12px] text-muted hover:text-warn"
                >
                  Annuler
                </button>
              </div>

              {invite?.id === m.id ? (
                <p className="rise rounded-none border border-gold/35 bg-gold/10 px-3.5 py-2.5 text-[11px] break-all text-gold-text">
                  {invite.url}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Sheet open={Boolean(assigning)} onClose={() => setAssigning(null)} title="Confier la feuille">
        <div className="flex flex-col gap-2">
          <p className="text-[12.5px] leading-5 text-muted">
            L&apos;arbitre choisi pourra marquer cette rencontre depuis son téléphone.
          </p>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (!assigning) return;
                run(`${p.name} arbitre`, () => assignOfficial(assigning.id, p.id));
                setAssigning(null);
              }}
              disabled={pending}
              className="press flex h-12 items-center gap-2.5 rounded-card border border-line px-3.5 text-left text-[13px] transition hover:bg-surface-2"
            >
              {pending ? <Spinner size={14} /> : <CheckIcon size={14} className="text-muted" />}
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

export function NewMatchButton({
  players,
  tables,
  venueId,
  onCreate,
}: {
  players: Person[];
  tables: { id: string; label: string }[];
  venueId: string;
  onCreate: (form: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const { notify } = useSnackbar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  // La sèche d'abord : c'est le match qu'on joue dans les salles d'ici.
  const [mode, setMode] = useState<Mode>("seche");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="press go flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-[13px] font-semibold text-gold-ink"
      >
        <PlusIcon size={16} /> Nouveau match
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nouveau match">
        <form
          action={(form) =>
            startTransition(async () => {
              form.set("venueId", venueId);
              const result = await onCreate(form);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setError(undefined);
              setOpen(false);
              notify("Match créé");
              router.refresh();
            })
          }
          className="flex flex-col gap-3.5"
        >
          {error ? (
            <p role="alert" className="shake rounded-none border border-warn/45 bg-warn/10 px-3.5 py-2.5 text-[12px] text-warn">
              {error}
            </p>
          ) : null}

          <Select label="Joueur A" name="playerAId" options={players.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Joueur B" name="playerBId" options={players.map((p) => ({ value: p.id, label: p.name }))} />
          <Select
            label="Table"
            name="tableId"
            options={[{ value: "", label: "à placer" }, ...tables.map((t) => ({ value: t.id, label: t.label }))]}
          />
          <Select
            label="Discipline"
            name="kind"
            options={Object.entries(DISCIPLINES).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Jeu"
            name="mode"
            options={MODES_OPTIONS}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Intitulé" name="label" defaultValue="Amical" />
            {/* Une sèche n'a pas de cible à saisir : elle vaut une partie, et
                demander « course à combien ? » pour un match qui s'arrête à la
                noire est exactement ce qui rendait la console incompréhensible. */}
            {mode === "course" ? (
              <Field label="Parties gagnantes" name="target" type="number" defaultValue="5" />
            ) : null}
          </div>
          <p className="text-[11.5px] text-muted">{MODES[mode].resume}</p>

          <button
            disabled={pending}
            className={cn(
              "press go mt-1 flex h-13 items-center justify-center gap-2 rounded-full bg-gold text-[14px] font-semibold text-gold-ink",
              pending && "opacity-60",
            )}
          >
            {pending ? <Spinner size={16} /> : null}
            Créer le match
          </button>
        </form>
      </Sheet>
    </>
  );
}

function Select({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-caps text-[10.5px] text-muted">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="h-12 rounded-none border border-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-gold"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-caps text-[10.5px] text-muted">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-12 rounded-none border border-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-gold"
      />
    </label>
  );
}
