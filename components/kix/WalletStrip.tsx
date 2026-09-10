import Link from "next/link";
import { CoinIcon, PlusIcon } from "@/components/icons";
import { pad2 } from "@/lib/format";

/** Solde de jetons : la donnée la plus consultée de l'app. */
export function WalletStrip({ balance }: { balance: number }) {
  return (
    <div className="glass-green flex items-center gap-3.5 rounded-card px-4 py-3.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-green/35 bg-green/15 text-green-text">
        <CoinIcon size={22} />
      </span>

      <div className="flex min-w-0 grow flex-col gap-0.5">
        <span className="label-caps">Solde KIX Pass</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[26px] leading-[26px] font-bold tracking-[-0.03em] text-green-text">
            {pad2(balance)}
          </span>
          <span className="text-xs whitespace-nowrap text-muted">jetons dispo</span>
        </span>
      </div>

      <Link
        href="/app/recharge"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-green px-4 text-[13px] font-semibold text-green-ink transition hover:brightness-105"
      >
        Recharger
        <PlusIcon size={14} />
      </Link>
    </div>
  );
}
