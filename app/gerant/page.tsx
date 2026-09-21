import Image from "next/image";
import { and, eq } from "drizzle-orm";
import { db, tokens } from "@/db";
import { ScanConsole } from "@/components/mb/ScanConsole";
import { Card, StatBlock } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MasterMark } from "@/components/icons";
import { getRecentScans, getVenueStats } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { passUrl } from "@/lib/pass";
import { cn } from "@/lib/cn";
import { group } from "@/lib/format";
import { Counter } from "@/components/ui/Counter";

export const metadata = { title: "Master Scan" };

export default async function GerantPage() {
  const manager = await requireRole("manager", "admin");
  const venueId = manager.venueId;
  const [stats, recent] = await Promise.all([
    venueId ? getVenueStats(venueId) : null,
    getRecentScans(venueId, 5),
  ]);

  // Un jeton actif de la salle, pour le bouton « simuler un scan » : on signe un
  // vrai laissez-passer, comme celui qu'affiche le téléphone du client.
  const sample = (
    await db
      .select({ id: tokens.id, code: tokens.code, userId: tokens.userId })
      .from(tokens)
      .where(and(eq(tokens.status, "active"), venueId ? eq(tokens.venueId, venueId) : eq(tokens.status, "active")))
      .limit(1)
  )[0];
  const samplePass = sample
    ? passUrl({ k: "token", i: sample.id, c: sample.code, u: sample.userId })
    : undefined;

  const venue = stats?.venue;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 lg:flex-col lg:items-start lg:gap-1">
          <span className="lg:hidden">
            <MasterMark size={28} />
          </span>
          <h1 className="text-xl lg:text-[26px]">Bonsoir {manager.name.split(" ")[0]}</h1>
          <p className="hidden text-[13px] text-muted lg:block">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })} · service
            en cours · {venue?.name ?? "toutes salles"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/12 px-3 py-2 text-[11px] text-gold-text">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-gold" />
            En ligne
          </span>
          <span className="lg:hidden">
            <ThemeToggle />
          </span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatBlock
          label="Jetons débités"
          value={<Counter value={stats?.debited ?? 0} />}
          hint="depuis minuit"
          className="rounded-none"
        />
        <StatBlock
          label="Recette du jour"
          value={
            <>
              <Counter value={stats?.revenue ?? 0} format="grouped" /> F
            </>
          }
          hint="versement lundi"
          tone="gold"
          className="rounded-none"
        />
        <StatBlock
          label="Tables occupées"
          value={`${stats?.tablesBusy ?? 0} / ${stats?.tablesTotal ?? 0}`}
          hint={venue ? `${venue.freeTables} libres` : "—"}
          className="rounded-none"
        />
        <StatBlock
          label="Billets scannés"
          value={<Counter value={stats?.tickets ?? 0} />}
          hint="entrées validées"
          tone="jade"
          className="rounded-none"
        />
      </div>

      <div className="grid min-h-0 gap-4 lg:grow lg:grid-cols-2">
        <ScanConsole samplePass={samplePass} />

        <Card shape="panel" className="flex min-h-0 flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px]">Derniers passages</h2>
            <span className="text-xs text-gold-text">Exporter</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {recent.map(({ scan, user, venue: scanVenue }) => (
              <div key={scan.id} className="flex items-center gap-3 rounded-none bg-surface px-3.5 py-3 transition hover:bg-surface-2">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={38}
                    height={38}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-dim">
                    {(user?.name ?? "MASTER BREAK").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-[13px] font-semibold">{user?.name ?? "Client MASTER BREAK"}</span>
                  <span className="truncate text-[11px] text-muted">
                    {scan.kind === "ticket" ? "Billet · entrée" : `Jeton · ${scanVenue?.name ?? ""}`} · code{" "}
                    {scan.code}
                  </span>
                </span>
                <span className="text-xs text-muted">
                  {scan.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-[11px]",
                    scan.kind === "ticket" ? "bg-jade/16 text-jade-text" : "bg-surface-2 text-dim",
                  )}
                >
                  {scan.kind === "ticket" ? "Pass validé" : "Débité"}
                </span>
              </div>
            ))}
          </div>

          <Card tone="dashed" shape="square" className="mt-auto flex items-center justify-between px-4 py-3.5">
            <span className="flex flex-col gap-0.5">
              <span className="text-xs text-muted">Commission Master Break du jour</span>
              <span className="text-[11px] text-muted">10 % des jetons vendus en ligne</span>
            </span>
            <span className="text-xl font-bold tracking-[-0.03em]">{group(stats?.commission ?? 0)} F</span>
          </Card>
        </Card>
      </div>
    </>
  );
}
