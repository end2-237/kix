import Link from "next/link";
import { PageHead, Pill, Table, Td } from "@/components/admin/AdminUI";
import { StatBlock } from "@/components/ui/Card";
import { getAdminStats, getRecentScans, getVenueBreakdown } from "@/lib/queries";
import { f, group } from "@/lib/format";
import { Counter } from "@/components/ui/Counter";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboard() {
  const [stats, breakdown, recent] = await Promise.all([
    getAdminStats(),
    getVenueBreakdown(),
    getRecentScans(null, 8),
  ]);

  return (
    <>
      <PageHead
        title="Tableau de bord"
        subtitle="Jetons, boutique et billetterie — toutes salles confondues."
        action={
          <Link
            href="/admin/salles"
            className="h-11 rounded-full bg-green px-5 text-[13px] leading-11 font-semibold text-green-ink"
          >
            Ajouter une salle
          </Link>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          label="Recette jetons du jour"
          value={
            <>
              <Counter value={stats.revenueToday} format="grouped" /> F
            </>
          }
          hint="parties scannées"
          tone="green"
          className="rounded-none"
        />
        <StatBlock
          label="Recharges sur 30 jours"
          value={
            <>
              <Counter value={stats.revenueMonth} format="grouped" /> F
            </>
          }
          hint={`${stats.tokensSold} jetons vendus`}
          className="rounded-none"
        />
        <StatBlock
          label="Boutique sur 30 jours"
          value={
            <>
              <Counter value={stats.ordersTotal} format="grouped" /> F
            </>
          }
          hint={`${stats.ordersCount} commandes`}
          tone="violet"
          className="rounded-none"
        />
        <StatBlock label="Billets vendus" value={<Counter value={stats.ticketsSold} />} hint={`${stats.clients} clients inscrits`} className="rounded-none" />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[17px]">Salles · 7 derniers jours</h2>
        <Table head={["Salle", "Ville", "Tables", "Jeton", "Parties", "Recette", "Commission KIX"]}>
          {breakdown.map((venue) => (
            <tr key={venue.id}>
              <Td className="font-semibold">{venue.name}</Td>
              <Td className="text-muted">{venue.city}</Td>
              <Td>{venue.tables}</Td>
              <Td>{f(venue.tokenPrice)}</Td>
              <Td>{venue.debited}</Td>
              <Td className="font-semibold">{f(Number(venue.revenue))}</Td>
              <Td className="text-green-text">{f(Math.round(Number(venue.revenue) * 0.1))}</Td>
            </tr>
          ))}
        </Table>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px]">Derniers passages</h2>
          <span className="text-[13px] text-muted">{group(stats.activeTokens)} jetons actifs en circulation</span>
        </div>
        <Table head={["Heure", "Client", "Salle", "Type", "Code", "Montant"]}>
          {recent.map(({ scan, user, venue }) => (
            <tr key={scan.id} className="transition hover:bg-surface">
              <Td className="text-muted">
                {scan.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </Td>
              <Td className="font-semibold">{user?.name ?? "—"}</Td>
              <Td className="text-muted">{venue?.name ?? "—"}</Td>
              <Td>
                <Pill tone={scan.kind === "ticket" ? "violet" : "green"}>
                  {scan.kind === "ticket" ? "Billet" : "Jeton"}
                </Pill>
              </Td>
              <Td className="text-muted">{scan.code}</Td>
              <Td>{scan.amount ? f(scan.amount) : "—"}</Td>
            </tr>
          ))}
        </Table>
      </section>
    </>
  );
}
