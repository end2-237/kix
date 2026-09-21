import { PageHead, Pill, Table, Td } from "@/components/admin/AdminUI";
import { setOrderStatus } from "@/lib/actions";
import { getAllOrders } from "@/lib/queries";
import { f } from "@/lib/format";

export const metadata = { title: "Commandes" };

const statuses = [
  { value: "paid", label: "Payée" },
  { value: "ready", label: "Prête" },
  { value: "done", label: "Récupérée" },
  { value: "cancelled", label: "Annulée" },
];

const tones: Record<string, "gold" | "jade" | "warn" | "neutral"> = {
  paid: "jade",
  ready: "gold",
  done: "neutral",
  cancelled: "warn",
};

export default async function AdminOrders() {
  const orders = await getAllOrders();

  return (
    <>
      <PageHead title="Commandes" subtitle="Boutique : suivi du paiement au retrait en salle." />

      <Table head={["Commande", "Client", "Salle", "Mode", "Total", "Statut", "Changer"]}>
        {orders.map(({ order, user, venue }) => (
          <tr key={order.id}>
            <Td>
              <span className="flex flex-col">
                <span className="font-semibold">{order.id.slice(0, 6).toUpperCase()}</span>
                <span className="text-[11px] text-muted">
                  {order.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
              </span>
            </Td>
            <Td>{user.name}</Td>
            <Td className="text-muted">{venue?.name ?? "—"}</Td>
            <Td className="text-muted">
              {order.fulfillment === "pickup" ? "Retrait" : "Livraison"} ·{" "}
              {order.method === "om" ? "OM" : "MoMo"}
            </Td>
            <Td className="font-semibold">{f(order.total)}</Td>
            <Td>
              <Pill tone={tones[order.status] ?? "neutral"}>
                {statuses.find((s) => s.value === order.status)?.label ?? order.status}
              </Pill>
            </Td>
            <Td>
              <form action={setOrderStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={order.id} />
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-9 rounded-none border border-line bg-surface px-2 text-[12px] text-ink"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value} className="bg-bg text-ink">
                      {status.label}
                    </option>
                  ))}
                </select>
                <button className="rounded-full bg-gold px-3 py-2 text-[11px] font-semibold text-gold-ink">
                  OK
                </button>
              </form>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
