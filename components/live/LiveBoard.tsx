"use client";

import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { useState } from "react";
import { LiveDot } from "@/components/live/LiveDot";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, PinIcon, TableIcon } from "@/components/icons";
import { useLive } from "@/lib/useLive";
import { cn } from "@/lib/cn";

export type BoardMatch = {
  id: string;
  status: string;
  scoreA: number;
  scoreB: number;
  target: number;
  turnId: string | null;
  kind: string;
  label: string;
  a: { id: string; name: string; avatar: string | null };
  b: { id: string; name: string; avatar: string | null };
  venue: string;
  table: string | null;
};

type Board = { live: BoardMatch[]; soon: BoardMatch[] };
type Tab = "live" | "soon" | "done";

/**
 * Le hub des scores. Le flux SSE ne concerne que ce qui bouge — les matchs en
 * cours et ceux à venir ; les résultats, eux, sont figés et restent rendus par
 * le serveur.
 */
export function LiveBoard({ initial, recent }: { initial: Board; recent: BoardMatch[] }) {
  const { data, connected } = useLive<Board>("/api/live", initial);
  const [tab, setTab] = useState<Tab>(data.live.length ? "live" : "soon");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "live", label: "En direct", count: data.live.length },
    { id: "soon", label: "À venir", count: data.soon.length },
    { id: "done", label: "Résultats", count: recent.length },
  ];
  const rows = tab === "live" ? data.live : tab === "soon" ? data.soon : recent;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "press flex h-10 items-center gap-2 rounded-full px-4 text-[13px] transition",
                tab === t.id ? "bg-gold font-semibold text-gold-ink" : "glass text-dim hover:text-ink",
              )}
            >
              {t.label}
              <span className={cn("text-[11px] tabular-nums", tab === t.id ? "text-gold-ink/70" : "text-muted")}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <LiveDot connected={connected} label="flux ouvert" />
      </div>

      {rows.length === 0 ? (
        <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <span className="grid h-13 w-13 place-items-center rounded-full bg-surface-2 text-muted">
            <TableIcon size={22} />
          </span>
          <p className="text-[13px] text-muted">
            {tab === "live"
              ? "Aucun match en cours. Le premier break arrive."
              : tab === "soon"
                ? "Rien de programmé pour l'instant."
                : "Pas encore de résultat."}
          </p>
        </Card>
      ) : (
        <div className="stagger flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3.5">
          {rows.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MatchRow({ match: m }: { match: BoardMatch }) {
  const live = m.status === "live";
  const aWins = m.scoreA > m.scoreB;

  return (
    <Link
      href={`/app/live/${m.id}`}
      className="glass lift flex flex-col gap-3 rounded-card p-3.5 transition hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="flex min-w-0 items-center gap-1.5 text-muted">
          <PinIcon size={12} className="shrink-0" />
          <span className="truncate">
            {m.venue}
            {m.table ? ` · ${m.table}` : ""}
          </span>
        </span>
        {live ? (
          <LiveDot />
        ) : (
          <span className="label-caps shrink-0 text-[10px] text-muted">
            {m.status === "done" ? "terminé" : m.label}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Line side={m.a} score={m.scoreA} lead={aWins} tone="gold" active={m.turnId === m.a.id} />
        <Line side={m.b} score={m.scoreB} lead={!aWins && m.scoreB > m.scoreA} tone="jade" active={m.turnId === m.b.id} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px] text-muted">
        <span>
          {m.kind} · course à {m.target}
        </span>
        <span className="flex items-center gap-1 text-gold-text">
          Suivre <ChevronRightIcon size={12} />
        </span>
      </div>
    </Link>
  );
}

function Line({
  side,
  score,
  lead,
  tone,
  active,
}: {
  side: { name: string; avatar: string | null };
  score: number;
  lead: boolean;
  tone: "gold" | "jade";
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {side.avatar ? (
        <Photo
          src={side.avatar}
          alt={side.name}
          width={28}
          height={28}
          className={cn("h-7 w-7 shrink-0 rounded-full object-cover ring-1", tone === "gold" ? "ring-gold/50" : "ring-jade/50")}
        />
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[9.5px] font-semibold">
          {side.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className={cn("min-w-0 grow truncate text-[13.5px]", lead ? "font-semibold" : "text-dim")}>
        {side.name}
      </span>
      {active ? (
        <span className={cn("live-dot h-1.5 w-1.5 shrink-0 rounded-full", tone === "gold" ? "bg-gold text-gold" : "bg-jade text-jade")} />
      ) : null}
      <span
        className={cn(
          "w-6 shrink-0 text-right text-[17px] font-bold tabular-nums",
          lead ? (tone === "gold" ? "text-gold-text" : "text-jade-text") : "text-muted",
        )}
      >
        {score}
      </span>
    </div>
  );
}
