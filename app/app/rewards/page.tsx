"use client";

import Image from "next/image";
import { useState } from "react";
import { ScreenHeader } from "@/components/kix/AppHeader";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BoltIcon, CartIcon, ClockIcon, TargetIcon, TrophyIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { group, leaderboard, you } from "@/lib/exports";
import { POINTS_PER_FREE_TOKEN, useKix } from "@/lib/store";

export default function RewardsPage() {
  const { points, convertPoints } = useKix();
  const [flash, setFlash] = useState<string | null>(null);
  const progress = Math.min(100, Math.round((points / you.levelTarget) * 100));
  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 4);

  function convert() {
    setFlash(convertPoints() ? "1 jeton ajouté à ton KIX Pass" : "Il te faut 500 points");
    window.setTimeout(() => setFlash(null), 2500);
  }

  return (
    <>
      <ScreenHeader title="KIX Rewards" />

      <Card
        tone="violet"
        className="flex flex-col gap-3.5 rounded-panel bg-linear-to-br from-violet/25 via-green/10 to-white/5 p-5"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid h-13 w-13 place-items-center rounded-[18px] border border-violet/45 bg-night/45 text-violet-soft">
            <TrophyIcon size={26} />
          </span>
          <div className="flex grow flex-col gap-0.5">
            <span className="text-[11px] tracking-[0.1em] text-violet-soft uppercase">Niveau {you.level}</span>
            <span className="font-display text-[22px]">{you.levelName}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-display text-xl">{group(points)}</span>
            <span className="text-[11px] text-muted">points</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-night/55">
            <div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-linear-to-r from-violet to-green transition-[width] duration-500"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-dim">
            <span>{group(Math.max(0, you.levelTarget - points))} XP avant le niveau {you.level + 1}</span>
            <span className="text-muted">{you.nextLevelName}</span>
          </div>
        </div>
      </Card>

      <Card tone="green" className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="flex grow flex-col gap-0.5">
          <span className="text-sm font-semibold">Convertir mes points</span>
          <span className="text-xs text-muted">
            {flash ?? `${POINTS_PER_FREE_TOKEN} pts = 1 jeton gratuit · ${Math.floor(points / POINTS_PER_FREE_TOKEN)} dispo`}
          </span>
        </div>
        <button
          onClick={convert}
          disabled={points < POINTS_PER_FREE_TOKEN}
          className="flex h-11 items-center rounded-[14px] bg-green px-4 text-[13px] font-semibold text-green-ink transition hover:brightness-105 disabled:opacity-40"
        >
          Convertir
        </button>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base">Classement · Douala</h2>
          <Chip tone="neutral" className="px-2.5 py-1.5 text-[11px]">
            Ce mois
          </Chip>
        </div>

        <div className="flex items-end gap-2.5">
          {[podium[1], podium[0], podium[2]].map((player, i) => {
            const first = i === 1;
            return (
              <div
                key={player.rank}
                className={cn(
                  "flex grow flex-col items-center gap-2 rounded-[18px] px-2 pb-3",
                  first
                    ? "glass-green border-[1.5px] border-green/50 pt-5"
                    : "glass pt-4",
                )}
              >
                {player.avatar ? (
                  <Image
                    src={player.avatar}
                    alt={player.name}
                    width={first ? 52 : 44}
                    height={first ? 52 : 44}
                    className={cn(
                      "rounded-full object-cover",
                      first ? "h-13 w-13 border-2 border-green" : "h-11 w-11",
                    )}
                  />
                ) : null}
                <span className={cn("font-semibold", first ? "text-[13px]" : "text-xs")}>
                  {player.name.split(" ")[0]}
                </span>
                <span className={cn("font-display", first ? "text-lg text-green" : "text-[15px] text-dim")}>
                  {player.rank}
                </span>
                <span className="text-[10px] text-muted">{group(player.points)} pts</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {rest.map((player) => (
            <div key={player.rank} className="flex items-center gap-3 rounded-2xl bg-white/4 px-3.5 py-2.5">
              <span className="w-6 font-display text-sm text-muted">{String(player.rank).padStart(2, "0")}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-dim">
                {player.initials}
              </span>
              <span className="grow text-[13px]">{player.name}</span>
              <span className="text-xs text-muted">{group(player.points)} pts</span>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-green/45 bg-green/12 px-3.5 py-2.5">
            <span className="w-6 font-display text-sm text-green">{you.rank}</span>
            <Image src={you.avatar} alt={you.name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
            <span className="grow text-[13px] font-semibold">Toi · {you.name}</span>
            <span className="text-xs text-green">{group(points)} pts</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-base">Défis de la semaine</h2>
        <Challenge
          icon={<TargetIcon size={18} />}
          tone="green"
          label="Joue 3 parties cette semaine"
          progress={66}
          reward="+150"
        />
        <Challenge
          icon={<CartIcon size={18} />}
          tone="violet"
          label="Première commande au Shop"
          progress={0}
          reward="+80"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip tone="neutral" className="text-[11px]">
          <BoltIcon size={13} className="text-green" />
          Série de 5 soirs
        </Chip>
        <Chip tone="neutral" className="text-[11px]">
          <ClockIcon size={13} className="text-violet-soft" />
          Noctambule
        </Chip>
        <Chip tone="neutral" className="text-[11px]">
          + 6 badges
        </Chip>
      </div>
    </>
  );
}

function Challenge({
  icon,
  tone,
  label,
  progress,
  reward,
}: {
  icon: React.ReactNode;
  tone: "green" | "violet";
  label: string;
  progress: number;
  reward: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-[18px] px-3.5 py-3">
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border",
          tone === "green" ? "border-green/32 bg-green/15 text-green" : "border-violet/32 bg-violet/15 text-violet-soft",
        )}
      >
        {icon}
      </span>
      <div className="flex grow flex-col gap-1.5">
        <span className="text-[13px] font-medium">{label}</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            style={{ width: `${progress}%` }}
            className={cn("h-full rounded-full", tone === "green" ? "bg-green" : "bg-violet")}
          />
        </div>
      </div>
      <span className={cn("text-xs font-semibold", tone === "green" ? "text-green" : "text-violet-soft")}>
        {reward}
      </span>
    </div>
  );
}
