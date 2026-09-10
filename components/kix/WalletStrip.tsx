"use client";

import Link from "next/link";
import { CoinIcon, PlusIcon } from "@/components/icons";
import { useKix } from "@/lib/store";
import { pad2 } from "@/lib/format";

export function WalletStrip() {
  const { tokenCount } = useKix();

  return (
    <div className="glass-green flex items-center gap-3.5 rounded-card px-4 py-3.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-green/35 bg-green/15 text-green">
        <CoinIcon size={22} />
      </span>

      <div className="flex min-w-0 grow flex-col gap-0.5">
        <span className="label-caps">Solde KIX Pass</span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-display text-[26px] leading-[26px] text-green">{pad2(tokenCount)}</span>
          <span className="text-xs whitespace-nowrap text-muted">jetons dispo</span>
        </span>
      </div>

      <Link
        href="/app/recharge"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-green px-4 text-[13px] font-semibold text-green-ink transition hover:brightness-105"
      >
        Recharger
        <PlusIcon size={14} />
      </Link>
    </div>
  );
}
