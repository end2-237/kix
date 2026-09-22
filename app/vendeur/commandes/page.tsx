import { Card } from "@/components/ui/Card";
import { Section } from "@/components/dash/Section";
import { getSoldeVendeur, getVentesVendeur } from "@/lib/seller";
import { requireRole } from "@/lib/session";
import { displayPhone } from "@/lib/phone";
import { f, fcfa } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes" };

const ETAT: Record<string, { label: string; ton: string }> = {
  paid: { label: "payée", ton: "border-gold/40 bg-gold/12 text-gold-text" },
  ready: { label: "prête", ton: "border-jade/40 bg-jade/12 text-jade-text" },
  delivered: { label: "remise", ton: "border-line bg-surface-2 text-dim" },
};

export default async function VendeurCommandes() {
  const vendeur = await requireRole("seller", "admin");
  const [ventes, solde] = await Promise.all([getVentesVendeur(vendeur.id, 80), getSoldeVendeur(vendeur.id)]);

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-xl lg:text-[26px]">Mes commandes</h1>
        <p className="text-[13px] text-muted">
          {solde.commandes} commande{solde.commandes > 1 ? "s" : ""} payée{solde.commandes > 1 ? "s" : ""} ·{" "}
          {fcfa(solde.net)} nets
        </p>
      </header>

      <Section title="Détail">
        {ventes.length === 0 ? (
          <Card tone="dashed" shape="panel" className="px-5 py-10 text-center text-[13px] text-muted">
            Aucune commande pour l&apos;instant.
          </Card>
        ) : null}

        <div className="flex flex-col gap-2.5">
          {ventes.map(({ item, order, product, client }) => {
            const etat = ETAT[order.status] ?? ETAT.paid;
            const brut = item.unitPrice * item.qty;
            return (
              <Card key={item.id} shape="panel" className="flex flex-col gap-2.5 p-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="truncate text-[14.5px] font-semibold">
                      {item.qty} × {product.name}
                    </span>
                    <span className="truncate text-[12px] text-muted">
                      {client.name} · {displayPhone(client.phone)}
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[10.5px]", etat.ton)}>
                    {etat.label}
                  </span>
                </div>

                {/* Le calcul est montré, pas asséné : le vendeur doit pouvoir
                    refaire l'opération sans nous croire sur parole. */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2.5 text-[12px] text-muted">
                  <span>{f(brut)} encaissés</span>
                  <span>− {f(item.commission)} de commission</span>
                  <span className="ml-auto text-[14px] font-semibold text-gold-text">{f(brut - item.commission)}</span>
                </div>

                <span className="text-[11px] text-muted">
                  {order.createdAt.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "long",
                  })}
                  {order.fulfillment === "delivery" ? " · livraison" : " · retrait en salle"}
                </span>
              </Card>
            );
          })}
        </div>
      </Section>
    </>
  );
}
