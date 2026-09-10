"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/kix/AppHeader";
import { QrCode } from "@/components/kix/QrCode";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClockIcon, CoinIcon, QrIcon, TrophyIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { clockFrom, pad2, venueById } from "@/lib/exports";
import { useKix } from "@/lib/store";

const CYCLE = 300; // le QR se régénère toutes les 5 minutes

export default function PassPage() {
  const { tokens, history } = useKix();
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(CYCLE);

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? CYCLE : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const token = tokens[Math.min(index, Math.max(tokens.length - 1, 0))];
  const venue = venueById(token?.venueId ?? "break-akwa");

  return (
    <>
      <ScreenHeader
        title="KIX Pass"
        action={
          <span className="glass grid h-11 w-11 place-items-center rounded-[14px] text-muted">
            <ClockIcon size={18} />
          </span>
        }
      />

      <Card tone="green" className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="flex grow flex-col gap-0.5">
          <span className="label-caps">Portefeuille de jetons</span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-[30px] leading-[30px] text-green">{pad2(tokens.length)}</span>
            <span className="text-xs text-muted">jetons · 1 en cours</span>
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 rounded-full border border-white/12 bg-night/55 px-2.5 py-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            {venue.name}
          </span>
          <span className="text-[11px] text-muted">Table 3 · ouverte</span>
        </div>
      </Card>

      {token ? (
        <div className="glass flex flex-col items-center gap-3.5 rounded-[26px] px-5 pt-6 pb-4 backdrop-blur-lg">
          <span className="flex items-center gap-2 rounded-full border border-green/35 bg-green/15 px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_rgba(61,240,138,0.9)]" />
            JETON {index + 1} / {tokens.length} — PRÊT À SCANNER
          </span>

          <div className="rounded-[22px] bg-white p-3 shadow-[0_0_40px_rgba(61,240,138,0.22)]">
            <QrCode value={`kix://jeton/${token.code}`} size={196} />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium">Présente ce code au gérant</span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <ClockIcon size={13} />
              Se régénère dans <span className="font-medium text-ink">{clockFrom(left)}</span>
            </span>
          </div>

          <div className="flex gap-1.5">
            {tokens.slice(0, 5).map((t, i) => (
              <button
                key={t.id}
                aria-label={`Jeton ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1 rounded-full transition",
                  i === index ? "w-4 bg-green" : "w-1.5 bg-white/30",
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-4 px-5 py-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-[18px] border border-white/10 bg-white/6 text-muted">
            <QrIcon size={26} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg">Plus de jetons</h2>
            <p className="text-[13px] text-muted">Recharge pour continuer à jouer.</p>
          </div>
          <Link
            href="/app/recharge"
            className="flex h-12 items-center gap-2 rounded-2xl bg-green px-5 text-sm font-semibold text-green-ink"
          >
            Recharger
            <ArrowRightIcon size={16} />
          </Link>
        </Card>
      )}

      {token ? (
        <Card tone="violet" className="flex items-center gap-3.5 px-4 py-3.5">
          <div className="flex grow flex-col gap-1">
            <span className="text-[13px] font-semibold text-violet-soft">Réseau faible ?</span>
            <span className="text-[11px] text-muted">Donne ce code au gérant</span>
          </div>
          <div className="flex gap-1.5">
            {token.code.split("").map((digit, i) => (
              <span
                key={i}
                className="grid h-11 w-9 place-items-center rounded-[11px] border border-violet/35 bg-night/55 font-display text-[19px]"
              >
                {digit}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px]">Activité récente</h2>
          <span className="text-xs text-green">Tout voir</span>
        </div>
        {history.slice(0, 3).map((entry) => (
          <div key={entry.id} className="flex items-center gap-3">
            <span className="glass grid h-10 w-10 place-items-center rounded-xl">
              {entry.kind === "in" ? (
                <ArrowRightIcon size={17} className="text-green" />
              ) : entry.kind === "out" ? (
                <QrIcon size={17} className="text-muted" />
              ) : (
                <TrophyIcon size={17} className="text-violet-soft" />
              )}
            </span>
            <span className="flex grow flex-col gap-0.5">
              <span className="text-[13px] font-medium">{entry.label}</span>
              <span className="text-[11px] text-muted">{entry.detail}</span>
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold",
                entry.kind === "in" ? "text-green" : entry.kind === "xp" ? "text-violet-soft" : "text-muted",
              )}
            >
              {entry.delta}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/gerant"
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/14 px-4 py-3 text-xs text-muted transition hover:text-dim"
      >
        <CoinIcon size={14} />
        Tu es gérant ? Ouvrir KIX Scan
      </Link>
    </>
  );
}
