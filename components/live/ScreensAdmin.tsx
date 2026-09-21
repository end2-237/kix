"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CAMERA_LABEL, QrCamera, type CameraState } from "@/components/mb/QrCamera";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { QrIcon, TableIcon } from "@/components/icons";
import { adoptScreen, removeScreen, renameScreen, setScreenStream } from "@/lib/actions";
import { cn } from "@/lib/cn";

export type ScreenRow = {
  id: string;
  name: string;
  online: boolean;
  lastSeen: string | null;
  streamId: string | null;
};

type Choix = { id: string; title: string; live: boolean };

/**
 * Les écrans de la salle.
 *
 * L'adoption se fait au QR — on scanne le téléviseur depuis le téléphone, on
 * ne recopie rien. La saisie à la main reste là pour les cas où la caméra
 * refuse ou l'écran est trop haut.
 */
export function ScreensAdmin({
  rows,
  streams,
  prefill,
}: {
  rows: ScreenRow[];
  streams: Choix[];
  prefill: string;
}) {
  const { notify } = useSnackbar();
  const [pending, startTransition] = useTransition();
  const [ouvert, setOuvert] = useState(Boolean(prefill));
  const [code, setCode] = useState(prefill);
  const [nom, setNom] = useState("");
  const [scan, setScan] = useState(false);
  const [camera, setCamera] = useState<CameraState>("demarrage");
  const [erreur, setErreur] = useState<string>();

  const run = (message: string, action: () => Promise<unknown>) =>
    startTransition(async () => {
      await action();
      notify(message);
    });

  function adopter() {
    setErreur(undefined);
    startTransition(async () => {
      const data = new FormData();
      data.set("code", code);
      data.set("name", nom);
      const res = (await adoptScreen(null, data)) as { ok: boolean; error?: string; name?: string };
      if (!res.ok) {
        setErreur(res.error);
        return;
      }
      notify(`${res.name} adopté`, { tone: "jade" });
      setOuvert(false);
      setCode("");
      setNom("");
      setScan(false);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl lg:text-[26px]">Les écrans</h1>
          <p className="text-[13px] text-muted">
            Les téléviseurs de la salle. Chacun montre le direct que tu lui donnes.
          </p>
        </div>
        <button
          onClick={() => setOuvert((v) => !v)}
          className="press flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-[13px] font-semibold text-gold-ink"
        >
          <QrIcon size={16} />
          Ajouter un écran
        </button>
      </header>

      {ouvert ? (
        <Card shape="panel" className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-[17px]">Adopter un téléviseur</h2>
            <p className="text-[13px] text-muted">
              Ouvre <span className="text-ink">{"/ecran"}</span> sur le téléviseur, puis scanne le QR qu&apos;il
              affiche.
            </p>
          </div>

          {scan ? (
            <div className="relative h-64 overflow-hidden rounded-panel border border-line bg-black">
              <QrCamera
                onCode={(valeur) => {
                  setCode(valeur);
                  setScan(false);
                }}
                onState={setCamera}
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setCamera("demarrage");
                setScan(true);
              }}
              className="glass press flex h-12 items-center justify-center gap-2 rounded-full text-[13px] text-dim hover:text-ink"
            >
              <QrIcon size={16} />
              Scanner le QR de l&apos;écran
            </button>
          )}

          {/* Le scan est le chemin court, pas le seul. Un téléviseur accroché
              trop haut, une caméra refusée, un ordinateur de comptoir sans
              objectif : la saisie doit rester une porte de plain-pied, pas un
              repli caché. */}
          <div className="flex items-center gap-3">
            <span className="h-px grow bg-line" />
            <span className="text-[11px] tracking-[0.12em] text-muted uppercase">
              {scan && camera !== "active" && camera !== "demarrage"
                ? `${CAMERA_LABEL[camera]} — saisis le code`
                : "ou saisis le code affiché"}
            </span>
            <span className="h-px grow bg-line" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="label-caps text-[10.5px] text-muted">Code affiché</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="7K4P2M"
                autoComplete="off"
                autoFocus={scan && (camera === "refusee" || camera === "absente" || camera === "insecure")}
                className="h-12 rounded-card border border-line bg-bg-2 px-3.5 font-mono text-[17px] tracking-[0.14em] uppercase outline-none focus:border-gold"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label-caps text-[10.5px] text-muted">Nom de l&apos;écran</span>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Bar gauche"
                autoComplete="off"
                className="h-12 rounded-card border border-line bg-bg-2 px-3.5 text-[15px] outline-none focus:border-gold"
              />
            </label>
          </div>

          {erreur ? <p className="text-[13px] text-warn">{erreur}</p> : null}

          <div className="flex gap-2">
            <button
              onClick={adopter}
              disabled={pending || code.trim().length === 0}
              className="press flex h-12 grow items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-gold-ink disabled:opacity-50"
            >
              {pending ? <Spinner size={16} /> : null}
              Adopter
            </button>
            <button
              onClick={() => setOuvert(false)}
              className="press h-12 rounded-full border border-line px-5 text-[13px] text-dim hover:text-ink"
            >
              Annuler
            </button>
          </div>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted">
            <TableIcon size={24} />
          </span>
          <h2 className="text-lg">Aucun écran</h2>
          <p className="max-w-md text-[13px] text-muted">
            Ouvre <span className="text-ink">/ecran</span> sur un téléviseur de la salle : il affichera un QR à
            scanner ici.
          </p>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <Ligne key={row.id} row={row} streams={streams} pending={pending} run={run} />
        ))}
      </div>
    </div>
  );
}

function Ligne({
  row,
  streams,
  pending,
  run,
}: {
  row: ScreenRow;
  streams: Choix[];
  pending: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
}) {
  const [nom, setNom] = useState(row.name);
  const enregistre = useRef(row.name);

  // Le parent se rafraîchit après chaque action : sans ceci, un renommage
  // fait ailleurs ne se verrait pas dans ce champ.
  useEffect(() => {
    if (row.name !== enregistre.current) {
      enregistre.current = row.name;
      setNom(row.name);
    }
  }, [row.name]);

  return (
    <Card shape="panel" className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
      <span
        className={cn(
          // `self-start` : en colonne, un enfant de flex s'étire sur toute la
          // largeur, et la pastille devenait une bannière.
          "flex w-fit shrink-0 self-start items-center gap-2 rounded-full px-3 py-1.5 text-[11px] lg:self-auto",
          row.online ? "border border-jade/40 bg-jade/12 text-jade-text" : "border border-line bg-surface-2 text-muted",
        )}
      >
        <i className={cn("h-1.5 w-1.5 rounded-full", row.online ? "bg-jade-clair" : "bg-muted")} />
        {row.online ? "en ligne" : "hors ligne"}
      </span>

      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        onBlur={() => {
          if (nom.trim() && nom !== enregistre.current) {
            enregistre.current = nom;
            run("Écran renommé", () => renameScreen(row.id, nom));
          }
        }}
        aria-label="Nom de l'écran"
        className="h-11 grow rounded-card border border-transparent bg-transparent px-2 text-[15px] font-semibold outline-none hover:border-line focus:border-gold"
      />

      <select
        value={row.streamId ?? ""}
        disabled={pending}
        onChange={(e) => run("Écran mis à jour", () => setScreenStream(row.id, e.target.value || null))}
        aria-label="Direct affiché"
        className="h-11 rounded-card border border-line bg-bg-2 px-3 text-[13px] outline-none focus:border-gold lg:w-72"
      >
        <option value="">— en veille —</option>
        {streams.map((s) => (
          <option key={s.id} value={s.id}>
            {s.live ? "● " : "○ "}
            {s.title}
          </option>
        ))}
      </select>

      <button
        onClick={() => run("Écran retiré", () => removeScreen(row.id))}
        disabled={pending}
        className="press h-11 shrink-0 rounded-full px-3 text-[12px] text-muted hover:text-warn"
      >
        Retirer
      </button>
    </Card>
  );
}
