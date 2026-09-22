import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ArrowRightIcon, CartIcon } from "@/components/icons";
import { getOrders } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { f, fcfa } from "@/lib/format";

export const metadata = { title: "Mes commandes" };

const statusLabels: Record<string, { label: string; tone: "gold" | "jade" | "neutral" | "warn" }> = {
  paid: { label: "Payée", tone: "jade" },
  ready: { label: "Prête au retrait", tone: "gold" },
  done: { label: "Récupérée", tone: "neutral" },
  pending: { label: "En attente", tone: "warn" },
  cancelled: { label: "Annulée", tone: "warn" },
};

export default async function CommandesPage() {
  const user = await requireUser();
  const orders = await getOrders(user.id);

  return (
    <>
      <ScreenHeader title="Mes commandes" subtitle="Suivi du paiement au retrait en salle." back="/app/shop" />

      {orders.length === 0 ? (
        <Card shape="panel" className="mt-4 flex flex-col items-center gap-4 px-5 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted">
            <CartIcon size={24} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg">Aucune commande</h2>
            <p className="text-[13px] text-muted">Ta première commande apparaîtra ici.</p>
          </div>
          <Link
            href="/app/shop"
            className="flex h-12 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
          >
            Aller au Shop
            <ArrowRightIcon size={16} />
          </Link>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      {orders.map((order) => {
        const status = statusLabels[order.status] ?? statusLabels.paid;
        return (
          <Card key={order.id} className="lift flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold">
                  Commande {order.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-[11px] text-muted">
                  {order.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} ·{" "}
                  {order.fulfillment === "pickup" ? order.venue?.name ?? "Retrait en salle" : "Livraison Douala"}
                </span>
              </div>
              <Chip tone={status.tone}>{status.label}</Chip>
            </div>

            <div className="flex flex-col gap-2">
              {order.items.map(({ item, product }) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Photo
                    src={product.image}
                    alt={product.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-card object-cover"
                  />
                  <span className="flex grow flex-col">
                    <span className="text-[13px]">{product.name}</span>
                    <span className="text-[11px] text-muted">
                      {item.qty} × {f(item.unitPrice)}
                    </span>
                  </span>
                  <span className="text-[13px] font-semibold">{f(item.qty * item.unitPrice)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-[11px] text-muted">
                {order.method === "om" ? "Orange Money" : "MTN MoMo"}
              </span>
              <span className="text-[17px] font-bold tracking-[-0.03em]">{fcfa(order.total)}</span>
            </div>
          </Card>
        );
      })}
      </div>
    </>
  );
}
