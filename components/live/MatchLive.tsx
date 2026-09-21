"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Scoreboard, type Side } from "@/components/live/Scoreboard";
import { StatBars, type StatRow } from "@/components/live/StatBars";
import { Card } from "@/components/ui/Card";
import { ClockIcon, TargetIcon, TrophyIcon } from "@/components/icons";
import { useLive } from "@/lib/useLive";
import { cn } from "@/lib/cn";

export type LiveStats = { racks: number; breaks: number; fouls: number; safeties: number; pots: number; run: number };

export type LiveEvent = {
  id: string;
  kind: string;
  playerId: string | null;
  detail: string;
  scoreA: number;
  scoreB: number;
  at: string;
};

export type LiveState = {
  id: string;
  status: string;
  scoreA: number;
  scoreB: number;
  target: number;
  turnId: string | null;
  winnerId: string | null;
  stats: { a: LiveStats; b: LiveStats };
  events: LiveEvent[];
};

export type H2H = { played: number; winsA: number; winsB: number };

type Tab = "stats" | "frise" | "h2h";

const eventLabel: Record<string, string> = {
  start: "Coup d'envoi",
  rack: "Manche remportée",
  foul: "Faute",
  break: "Casse gagnante",
  safety: "Sécurité",
  pot: "Empochage",
  note: "Correction",
  end: "Fin de match",
};

const eventTone: Record<string, string> = {
  rack: "bg-gold",
  break: "bg-live",
  foul: "bg-warn",
  safety: "bg-jade",
  pot: "bg-jade",
  start: "bg-muted",
  end: "bg-muted",
  note: "bg-muted",
};

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * La fiche d'un match en direct : tableau d'affichage, statistiques comparées,
 * frise coup par coup et confrontations passées. Tout est poussé par le flux
 * SSE ; le mode plein écran réutilise le même état, en grand, pour l'écran de
 * la salle.
 */
export function MatchLive({
  initial,
  a,
  b,
  h2h,
  label,
  venue,
  kind,
}: {
  initial: LiveState;
  a: Side;
  b: Side;
  h2h: H2H;
  label: string;
  venue: string;
  kind: string;
}) {
  const { data, connected } = useLive<LiveState>(`/api/live/${initial.id}`, initial);
  const [tab, setTab] = useState<Tab>("stats");
  const [tv, setTv] = useState(false);
  const shell = useRef<HTMLDivElement>(null);

  // L'API plein écran demande un geste de l'utilisateur ; on suit aussi les
  // sorties par la touche Échap, que le navigateur gère seul.
  const toggleTv = useCallback(async () => {
    const node = shell.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen();
    } catch {
      // Plein écran refusé (iOS notamment) : on bascule quand même la mise en page.
      setTv((v) => !v);
    }
  }, []);

  useEffect(() => {
    const sync = () => setTv(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const rows: StatRow[] = [
    { label: "Manches gagnées", a: data.stats.a.racks, b: data.stats.b.racks },
    { label: "Casses gagnantes", a: data.stats.a.breaks, b: data.stats.b.breaks },
    { label: "Meilleure série", a: data.stats.a.run, b: data.stats.b.run },
    { label: "Empochages", a: data.stats.a.pots, b: data.stats.b.pots },
    { label: "Sécurités", a: data.stats.a.safeties, b: data.stats.b.safeties },
    { label: "Fautes", a: data.stats.a.fouls, b: data.stats.b.fouls },
  ];

  const scoreboard = (
    <Scoreboard
      a={a}
      b={b}
      scoreA={data.scoreA}
      scoreB={data.scoreB}
      target={data.target}
      turnId={data.turnId}
      status={data.status}
      winnerId={data.winnerId}
      connected={connected}
      label={`${label} · ${kind}`}
      size={tv ? "tv" : "page"}
    />
  );

  return (
    <div
      ref={shell}
      className={cn(tv && "flex h-dvh w-dvw flex-col justify-between gap-6 overflow-hidden bg-bg px-[4vw] py-[3vh]")}
    >
      {tv ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[clamp(13px,1.6vw,28px)] tracking-[0.2em] text-muted uppercase">{venue}</span>
            <button
              onClick={toggleTv}
              className="press rounded-full border border-line px-5 py-2.5 text-[13px] text-muted hover:text-ink"
            >
              Quitter le plein écran
            </button>
          </div>

          <div className="flex grow flex-col justify-center">{scoreboard}</div>

          {/* En grand, on ne garde que les chiffres qui se lisent de loin. */}
          <div className="mx-auto w-full max-w-5xl">
            <StatBars rows={rows.slice(0, 3)} size="tv" />
          </div>

          <div className="flex justify-center gap-3">
            {data.events.slice(0, 6).map((e) => (
              <span
                key={e.id}
                className="flex items-center gap-2 rounded-full border border-line px-[1.4vw] py-[0.9vh] text-[clamp(12px,1.2vw,20px)] text-dim"
              >
                <span className={cn("h-2 w-2 rounded-full", eventTone[e.kind] ?? "bg-muted")} />
                {e.scoreA} – {e.scoreB}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <Card shape="panel" tone="glass" className="flex flex-col gap-5 p-5 lg:p-7">
            {scoreboard}

            <div className="flex items-center justify-center gap-2.5 border-t border-line pt-4">
              <button
                onClick={toggleTv}
                className="press glass flex h-10 items-center gap-2 rounded-full px-4 text-[12.5px] text-dim transition hover:text-ink"
              >
                <ExpandIcon /> Plein écran
              </button>
              <span className="text-[11.5px] text-muted">{venue}</span>
            </div>
          </Card>

          <div className="flex gap-2">
            {(
              [
                ["stats", "Statistiques"],
                ["frise", "Déroulé"],
                ["h2h", "Face à face"],
              ] as [Tab, string][]
            ).map(([id, text]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "press h-10 rounded-full px-4 text-[13px] transition",
                  tab === id ? "bg-gold font-semibold text-gold-ink" : "glass text-dim hover:text-ink",
                )}
              >
                {text}
              </button>
            ))}
          </div>

          {tab === "stats" ? (
            <Card shape="panel" className="p-5 lg:px-10 lg:py-7">
              <div className="mx-auto max-w-2xl">
                <StatBars rows={rows} />
              </div>
            </Card>
          ) : null}

          {tab === "frise" ? (
            <Card shape="panel" className="flex flex-col gap-3 p-5">
              {data.events.length === 0 ? (
                <p className="text-[13px] text-muted">Le match n&apos;a pas encore commencé.</p>
              ) : (
                <ol className="flex flex-col gap-2.5">
                  {data.events.map((e) => {
                    const who = e.playerId === a.id ? a : e.playerId === b.id ? b : null;
                    return (
                      <li key={e.id} className="flex items-center gap-3 rounded-none bg-surface px-3.5 py-2.5">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", eventTone[e.kind] ?? "bg-muted")} />
                        <span className="flex min-w-0 grow flex-col gap-0.5">
                          <span className="text-[13px]">
                            {eventLabel[e.kind] ?? e.kind}
                            {who ? <span className="text-muted"> · {who.name}</span> : null}
                          </span>
                          {e.detail && e.detail !== eventLabel[e.kind] ? (
                            <span className="text-[11px] text-muted">{e.detail}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-[13px] font-bold tabular-nums">
                          {e.scoreA} – {e.scoreB}
                        </span>
                        <span className="w-10 shrink-0 text-right text-[11px] text-muted tabular-nums">
                          {hhmm(e.at)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>
          ) : null}

          {tab === "h2h" ? (
            <Card shape="panel" className="flex flex-col gap-5 p-5">
              <div className="flex items-center justify-between gap-4">
                <Stat value={h2h.winsA} label={a.name} tone="gold" icon={<TrophyIcon size={15} />} />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[28px] font-bold tracking-[-0.03em]">{h2h.played}</span>
                  <span className="label-caps text-[10px] text-muted">rencontres</span>
                </div>
                <Stat value={h2h.winsB} label={b.name} tone="jade" icon={<TargetIcon size={15} />} align="right" />
              </div>

              {h2h.played === 0 ? (
                <p className="border-t border-line pt-4 text-[13px] text-muted">
                  Première confrontation entre ces deux-là.
                </p>
              ) : (
                <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
                  <span className="bg-gold" style={{ width: `${(h2h.winsA / h2h.played) * 100}%` }} />
                  <span className="bg-jade" style={{ width: `${(h2h.winsB / h2h.played) * 100}%` }} />
                </div>
              )}
            </Card>
          ) : null}

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <ClockIcon size={12} />
            {connected ? "Score poussé en direct depuis la salle" : "Reconnexion au flux…"}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
  icon,
  align = "left",
}: {
  value: number;
  label: string;
  tone: "gold" | "jade";
  icon: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", align === "right" && "items-end text-right")}>
      <span
        className={cn(
          "flex items-center gap-1.5 text-[28px] font-bold tracking-[-0.03em]",
          tone === "gold" ? "text-gold-text" : "text-jade-text",
          align === "right" && "flex-row-reverse",
        )}
      >
        {icon}
        {value}
      </span>
      <span className="truncate text-[11.5px] text-muted">{label}</span>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}
