"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GoLive } from "@/components/live/GoLive";
import { LiveDot } from "@/components/live/LiveDot";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { LockIcon, PlusIcon, UserIcon } from "@/components/icons";
import { deleteStream, endStream, rotateStreamKey } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { f } from "@/lib/format";

export type StreamRow = {
  id: string;
  title: string;
  level: string;
  levelLabel: string;
  access: string;
  accessLabel: string;
  price: number;
  status: string;
  viewers: number;
  peakViewers: number;
  match: string | null;
  ingest: { server: string; key: string; whip: string };
};

/**
 * La console de diffusion de la salle. Trois niveaux de production, trois
 * façons d'envoyer le flux : la caméra du téléphone depuis cette page, ou les
 * coordonnées RTMP à coller dans OBS ou dans une caméra IP.
 */
export function StreamAdmin({ rows }: { rows: StreamRow[] }) {
  const { notify } = useSnackbar();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [publishing, setPublishing] = useState<StreamRow | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  const run = (label: string, fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      notify(label);
      router.refresh();
    });

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${what} copié`);
    } catch {
      notify(`${what} affiché`, { detail: "Copie-le depuis l'écran" });
    }
  }

  if (rows.length === 0) {
    return (
      <Card tone="dashed" shape="panel" className="px-5 py-8 text-center text-[13px] text-muted">
        Aucun direct. Crée-en un pour filmer une table.
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const live = row.status === "live";
          return (
            <Card key={row.id} shape="square" className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-[14px] font-semibold">{row.title}</span>
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-muted">
                    <span>{row.levelLabel}</span>
                    <span className={cn(row.access !== "free" && "text-gold-text")}>
                      {row.access === "ppv" ? `${row.accessLabel} · ${f(row.price)}` : row.accessLabel}
                    </span>
                    {row.match ? <span>{row.match}</span> : null}
                  </span>
                </span>
                {live ? (
                  <span className="flex shrink-0 items-center gap-2">
                    <LiveDot />
                    <span className="flex items-center gap-1 text-[11.5px] text-muted">
                      <UserIcon size={11} /> {row.viewers}
                    </span>
                  </span>
                ) : (
                  <span className="label-caps shrink-0 text-[10px] text-muted">
                    {row.status === "ended" ? "terminé" : "en attente"}
                  </span>
                )}
              </div>

              {/* Les coordonnées d'ingestion ne s'affichent que sur demande :
                  la clé donne le droit de diffuser sous le nom de la salle. */}
              {shown === row.id ? (
                <div className="rise flex flex-col gap-2 rounded-none border border-gold/30 bg-gold/8 p-3.5">
                  <Line label="Serveur RTMP" value={row.ingest.server} onCopy={() => copy(row.ingest.server, "Serveur")} />
                  <Line label="Clé de diffusion" value={row.ingest.key} secret onCopy={() => copy(row.ingest.key, "Clé")} />
                  <Line label="WHIP (navigateur)" value={row.ingest.whip} onCopy={() => copy(row.ingest.whip, "URL WHIP")} />
                  <p className="text-[11px] text-muted">
                    Dans OBS : Paramètres → Flux → Service « Personnalisé », puis colle serveur et clé.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {row.level === "phone" ? (
                  <button
                    onClick={() => setPublishing(row)}
                    className="press flex h-9 items-center gap-1.5 rounded-full bg-gold px-3.5 text-[12px] font-semibold text-gold-ink"
                  >
                    Diffuser d&apos;ici
                  </button>
                ) : null}

                <button
                  onClick={() => setShown(shown === row.id ? null : row.id)}
                  className="press flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[12px] text-dim hover:text-ink"
                >
                  <LockIcon size={12} /> {shown === row.id ? "Masquer" : "Coordonnées"}
                </button>

                <Link
                  href={`/direct/${row.id}`}
                  className="press flex h-9 items-center rounded-full border border-line px-3.5 text-[12px] text-dim hover:text-ink"
                >
                  Voir
                </Link>

                <button
                  onClick={() => run("Clé régénérée", () => rotateStreamKey(row.id))}
                  disabled={pending}
                  className="press h-9 rounded-full px-3 text-[12px] text-muted hover:text-ink"
                >
                  Nouvelle clé
                </button>

                {live ? (
                  <button
                    onClick={() => run("Direct arrêté", () => endStream(row.id))}
                    disabled={pending}
                    className="press ml-auto h-9 rounded-full px-3 text-[12px] text-muted hover:text-warn"
                  >
                    Arrêter
                  </button>
                ) : (
                  <button
                    onClick={() => run("Direct supprimé", () => deleteStream(row.id))}
                    disabled={pending}
                    className="press ml-auto h-9 rounded-full px-3 text-[12px] text-muted hover:text-warn"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet
        open={Boolean(publishing)}
        onClose={() => setPublishing(null)}
        title={publishing?.title ?? ""}
        className="sm:max-w-[32rem]"
      >
        {publishing ? (
          <GoLive whip={publishing.ingest.whip} streamKey={publishing.ingest.key} title={publishing.title} />
        ) : null}
      </Sheet>
    </>
  );
}

function Line({
  label,
  value,
  secret,
  onCopy,
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: () => void;
}) {
  const [revealed, setRevealed] = useState(!secret);
  return (
    <div className="flex items-center gap-2.5">
      <span className="label-caps w-28 shrink-0 text-[10px] text-muted">{label}</span>
      <code className="min-w-0 grow truncate font-mono text-[11.5px] text-gold-text">
        {revealed ? value : "•".repeat(Math.min(28, value.length))}
      </code>
      {secret ? (
        <button
          onClick={() => setRevealed((v) => !v)}
          className="press shrink-0 text-[11px] text-muted hover:text-ink"
        >
          {revealed ? "Cacher" : "Voir"}
        </button>
      ) : null}
      <button onClick={onCopy} className="press shrink-0 text-[11px] text-gold-text hover:underline">
        Copier
      </button>
    </div>
  );
}

export function NewStreamButton({
  matches,
  salles,
  onCreate,
}: {
  matches: { id: string; label: string }[];
  /** Les salles au choix : un joueur filme là où il joue, un gérant chez lui. */
  salles?: { id: string; label: string }[];
  onCreate: (form: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const { notify } = useSnackbar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState("free");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="press go flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-[13px] font-semibold text-gold-ink"
      >
        <PlusIcon size={16} /> Nouveau direct
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nouveau direct">
        <form
          action={(form) =>
            startTransition(async () => {
              const result = await onCreate(form);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setError(undefined);
              setOpen(false);
              notify("Direct créé");
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

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10.5px] text-muted">Titre</span>
            <input
              name="title"
              placeholder="Table 1 · quart de finale"
              className="h-12 rounded-none border border-line bg-surface px-3 text-[14px] outline-none focus:border-gold"
            />
          </label>

          <Choice
            label="Niveau de production"
            name="level"
            options={[
              ["phone", "Téléphone — depuis cette page"],
              ["venue", "Caméra de salle — RTMP continu"],
              ["production", "Production — OBS, multi-caméra"],
            ]}
          />

          <Choice
            label="Qui peut regarder"
            name="access"
            onChange={setAccess}
            options={[
              ["free", "Accès libre"],
              ["members", "Abonnés Master Break"],
              ["ppv", "Billet vidéo payant"],
            ]}
          />

          {access === "ppv" ? (
            <label className="rise flex flex-col gap-1.5">
              <span className="label-caps text-[10.5px] text-muted">Prix du billet (F)</span>
              <input
                name="price"
                type="number"
                defaultValue={500}
                className="h-12 rounded-none border border-line bg-surface px-3 text-[14px] outline-none focus:border-gold"
              />
            </label>
          ) : null}

          {salles && salles.length > 0 ? (
            <label className="flex flex-col gap-1.5">
              <span className="label-caps text-[10.5px] text-muted">Salle</span>
              <select
                name="venueId"
                className="h-12 rounded-none border border-line bg-surface px-3 text-[14px] outline-none focus:border-gold"
              >
                {salles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="label-caps text-[10.5px] text-muted">Match filmé</span>
            <select
              name="matchId"
              className="h-12 rounded-none border border-line bg-surface px-3 text-[14px] outline-none focus:border-gold"
            >
              <option value="">aucun — caméra de salle</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={pending}
            className="press go mt-1 flex h-13 items-center justify-center gap-2 rounded-full bg-gold text-[14px] font-semibold text-gold-ink disabled:opacity-60"
          >
            {pending ? <Spinner size={16} /> : null}
            Créer le direct
          </button>
        </form>
      </Sheet>
    </>
  );
}

function Choice({
  label,
  name,
  options,
  onChange,
}: {
  label: string;
  name: string;
  options: [string, string][];
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(options[0][0]);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-caps text-[10.5px] text-muted">{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-col gap-1.5">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setValue(id);
              onChange?.(id);
            }}
            className={cn(
              "press flex h-11 items-center rounded-card border px-3.5 text-left text-[13px] transition",
              value === id ? "border-gold bg-gold/10 font-semibold text-gold-text" : "border-line text-dim hover:bg-surface-2",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
