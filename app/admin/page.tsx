import { Pill, Table, Td } from "@/components/admin/AdminUI";
import { Hero } from "@/components/dash/Hero";
import { Section, Tile, Tiles } from "@/components/dash/Section";
import {
  CalendarIcon,
  CartIcon,
  CoinIcon,
  MapIcon,
  TableIcon,
  TicketIcon,
  TruckIcon,
  UserIcon,
} from "@/components/icons";
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
      {/* La recette du jour en tête, comme chez le gérant : la première chose
          qu'on veut savoir en ouvrant l'application, et la seule qui mérite
          d'être lisible à bout de bras. */}
      <Hero label="Recette jetons du jour" value={group(stats.revenueToday)} suffix="FCFA">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
          <span>
            <span className="font-semibold text-ink">{group(stats.tokensSold)}</span> jetons vendus sur 30 j
          </span>
          <span>
            <span className="font-semibold text-ink">{group(stats.clients)}</span> clients inscrits
          </span>
        </div>
      </Hero>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <StatBlock
          label="Recharges 30 j"
          value={
            <>
              <Counter value={stats.revenueMonth} format="grouped" /> F
            </>
          }
          hint={`${stats.tokensSold} jeton${stats.tokensSold > 1 ? "s" : ""}`}
        />
        <StatBlock
          label="Boutique 30 j"
          value={
            <>
              <Counter value={stats.ordersTotal} format="grouped" /> F
            </>
          }
          hint={`${stats.ordersCount} commande${stats.ordersCount > 1 ? "s" : ""}`}
          tone="jade"
        />
        <StatBlock
          label="Billets vendus"
          value={<Counter value={stats.ticketsSold} />}
          hint={`${group(stats.activeTokens)} jetons actifs`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <Section title="Gérer">
        <Tiles>
          <Tile href="/admin/salles" label="Salles" icon={<MapIcon size={17} />} />
          <Tile href="/admin/produits" label="Produits" icon={<CartIcon size={17} />} />
          <Tile href="/admin/commandes" label="Commandes" icon={<TruckIcon size={17} />} />
          <Tile href="/admin/packs" label="Packs" icon={<CoinIcon size={17} />} />
          <Tile href="/admin/evenements" label="Soirées" icon={<CalendarIcon size={17} />} />
          <Tile href="/admin/tables" label="Tables" icon={<TableIcon size={17} />} />
          <Tile href="/admin/jetons" label="Jetons" icon={<TicketIcon size={17} />} />
          <Tile href="/admin/utilisateurs" label="Comptes" icon={<UserIcon size={17} />} />
        </Tiles>
      </Section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[17px]">Salles · 7 derniers jours</h2>
        <Table head={["Salle", "Ville", "Tables", "Jeton", "Parties", "Recette", "Commission Master Break"]}>
          {breakdown.map((venue) => (
            <tr key={venue.id}>
              <Td className="font-semibold">{venue.name}</Td>
              <Td className="text-muted">{venue.city}</Td>
              <Td>{venue.tables}</Td>
              <Td>{f(venue.tokenPrice)}</Td>
              <Td>{venue.debited}</Td>
              <Td className="font-semibold">{f(Number(venue.revenue))}</Td>
              <Td className="text-gold-text">{f(Math.round(Number(venue.revenue) * 0.1))}</Td>
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
                <Pill tone={scan.kind === "ticket" ? "jade" : "gold"}>
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
