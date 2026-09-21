import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { PassWallet, type WalletToken } from "@/components/mb/PassWallet";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClockIcon, CoinIcon, QrIcon, TrophyIcon } from "@/components/icons";
import { getActiveTokens, getActivity, getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { qrShape } from "@/lib/qr";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";

export const metadata = { title: "Master Pass" };

export default async function PassPage() {
  const user = await requireUser();
  const [tokens, activity, venues] = await Promise.all([
    getActiveTokens(user.id),
    getActivity(user.id, 5),
    getVenues(),
  ]);

  const wallet: WalletToken[] = tokens.map((token) => ({
    id: token.id,
    code: token.code,
    venue: venues.find((v) => v.id === token.venueId)?.name ?? "Toutes les salles partenaires",
    shape: qrShape(`mb://jeton/${token.code}`),
  }));
  const current = tokens[0];
  const currentVenue = venues.find((v) => v.id === current?.venueId);

  return (
    <>
      <ScreenHeader
        title="Master Pass"
        subtitle="Un QR par partie, un code de secours quand le réseau lâche."
        action={
          <Link href="/app/notifications" className="glass grid h-11 w-11 place-items-center rounded-full text-muted">
            <ClockIcon size={18} />
          </Link>
        }
      />

      <Card tone="gold" className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="flex grow flex-col gap-0.5">
          <span className="label-caps">Portefeuille de jetons</span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-[30px] leading-[30px] font-bold tracking-[-0.03em] text-gold-text">
                  {pad2(tokens.length)}
                </span>
            <span className="text-xs text-muted">jetons actifs</span>
              </span>
            </div>
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1.5 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {currentVenue?.name ?? "Toutes salles"}
              </span>
          <span className="text-[11px] text-muted">{user.points} points Master</span>
            </div>
      </Card>

      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* colonne QR — collante au défilement sur grand écran */}
        <div className="lg:sticky lg:top-8">
          {wallet.length > 0 ? (
            <PassWallet tokens={wallet} />
          ) : (
            <Card shape="panel" className="flex flex-col items-center gap-4 px-5 py-9 text-center lg:py-16">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-muted">
                <QrIcon size={26} />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg">Plus de jetons</h2>
                <p className="text-[13px] text-muted">Recharge pour continuer à jouer.</p>
              </div>
              <Link
                href="/app/recharge"
                className="flex h-12 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
              >
                Recharger
                <ArrowRightIcon size={16} />
              </Link>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-3.5 lg:gap-5">
          {current ? (
            <Card tone="jade" className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="flex grow flex-col gap-1">
                <span className="text-[13px] font-semibold text-jade-text">Réseau faible ?</span>
                <span className="text-[11px] text-muted">Donne ce code au gérant</span>
              </div>
              <div className="flex gap-1.5">
                {current.code.split("").map((digit, i) => (
                  <span
                    key={i}
                    className="grid h-11 w-9 place-items-center rounded-none border border-jade/35 bg-bg-2 text-[19px] font-bold"
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
              <Link href="/app/commandes" className="text-xs text-gold-text">
                Mes commandes
              </Link>
            </div>
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3">
                <span className="glass grid h-10 w-10 place-items-center rounded-full">
                  {entry.kind === "in" ? (
                    <CoinIcon size={17} className="text-gold-text" />
                  ) : entry.kind === "out" ? (
                    <QrIcon size={17} className="text-muted" />
                  ) : (
                    <TrophyIcon size={17} className="text-jade-text" />
                  )}
                </span>
                <span className="flex grow flex-col gap-0.5">
                  <span className="text-[13px] font-medium">{entry.label}</span>
                  <span className="text-[11px] text-muted">{entry.detail}</span>
                </span>
                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    entry.kind === "in"
                      ? "text-gold-text"
                      : entry.kind === "xp"
                        ? "text-jade-text"
                        : "text-muted",
                  )}
                >
                  {entry.delta}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/gerant"
            className="flex items-center justify-center gap-2 rounded-full border border-dashed border-line px-4 py-3 text-xs text-muted transition hover:text-dim"
          >
            <CoinIcon size={14} />
            Tu es gérant ? Ouvrir Master Scan
          </Link>
        </div>
      </div>
    </>
  );
}
