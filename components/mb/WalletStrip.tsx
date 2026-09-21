import Link from "next/link";
import { CoinIcon, PlusIcon } from "@/components/icons";
import { Counter } from "@/components/ui/Counter";

/** Solde de jetons : la donnée la plus consultée de l'app. */
export function WalletStrip({ balance }: { balance: number }) {
  return (
    <div className="glass-gold flex items-center gap-3.5 rounded-card px-4 py-3.5 transition hover:border-gold/50">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/35 bg-gold/15 text-gold-text">
        <CoinIcon size={22} />
      </span>

      <div className="flex min-w-0 grow flex-col gap-0.5">
        <span className="label-caps">Solde Master Pass</span>
        <span className="flex items-baseline gap-1.5">
          <Counter
            value={balance}
            format="pad2"
            animateOnMount={false}
            className="text-[26px] leading-[26px] font-bold tracking-[-0.03em] text-gold-text"
          />
          <span className="text-xs whitespace-nowrap text-muted">jetons dispo</span>
        </span>
      </div>

      <Link
        href="/app/recharge"
        className="press go flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 text-[13px] font-semibold text-gold-ink transition hover:brightness-105"
      >
        Recharger
        <PlusIcon size={14} />
      </Link>
    </div>
  );
}
