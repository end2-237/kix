import { PageHead, Pill, Table, Td } from "@/components/admin/AdminUI";
import { StatBlock } from "@/components/ui/Card";
import { getAdminStats, getAllPurchases } from "@/lib/queries";
import { f } from "@/lib/format";

export const metadata = { title: "Jetons & recharges" };

export default async function AdminTokens() {
  const [purchases, stats] = await Promise.all([getAllPurchases(30), getAdminStats()]);

  return (
    <>
      <PageHead title="Jetons &amp; recharges" subtitle="Chaque recharge Mobile Money et les jetons qu'elle crédite." />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <StatBlock label="Jetons actifs" value={stats.activeTokens} hint="en circulation" className="rounded-none" />
        <StatBlock label="Vendus sur 30 j" value={stats.tokensSold} hint="jetons crédités" tone="green" className="rounded-none" />
        <StatBlock label="Recharges sur 30 j" value={f(stats.revenueMonth)} hint="encaissé" tone="violet" className="rounded-none" />
      </div>

      <Table head={["Date", "Client", "Salle", "Jetons", "Montant", "Moyen", "Statut"]}>
        {purchases.map(({ purchase, user, venue }) => (
          <tr key={purchase.id}>
            <Td className="text-muted">
              {purchase.createdAt.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Td>
            <Td className="font-semibold">{user.name}</Td>
            <Td className="text-muted">{venue?.name ?? "—"}</Td>
            <Td>+{purchase.tokens}</Td>
            <Td className="font-semibold">{f(purchase.amount)}</Td>
            <Td className="text-muted">{purchase.method === "om" ? "Orange Money" : "MTN MoMo"}</Td>
            <Td>
              <Pill tone={purchase.status === "paid" ? "green" : "amber"}>
                {purchase.status === "paid" ? "Payée" : purchase.status}
              </Pill>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
