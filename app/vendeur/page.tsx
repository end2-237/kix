import { Hero } from "@/components/dash/Hero";
import { Section, Tile, Tiles } from "@/components/dash/Section";
import { Card, StatBlock } from "@/components/ui/Card";
import { CartIcon, TruckIcon } from "@/components/icons";
import { getProduitsVendeur, getSoldeVendeur, getVentesVendeur } from "@/lib/seller";
import { requireRole } from "@/lib/session";
import { COMMISSION_RATE } from "@/lib/constants";
import { f, fcfa, group } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes ventes" };

export default async function VendeurAccueil() {
  const vendeur = await requireRole("seller", "admin");
  const [solde, articles, ventes] = await Promise.all([
    getSoldeVendeur(vendeur.id),
    getProduitsVendeur(vendeur.id),
    getVentesVendeur(vendeur.id, 8),
  ]);

  const actifs = articles.filter(({ product }) => product.active).length;
  const enRupture = articles.filter(({ product }) => product.active && product.stock === 0).length;

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-[17px] leading-tight lg:text-[26px]">Bonjour {vendeur.name.split(" ")[0]}</h1>
          <p className="text-[11.5px] text-muted lg:text-[13px]">
            {articles.length} article{articles.length > 1 ? "s" : ""} en vente
          </p>
        </div>
      </header>

      {/* Le solde d'abord : c'est la seule question qu'un vendeur se pose en
          ouvrant l'application. Le brut et la commission suivent, pour que le
          chiffre ne soit pas une affirmation mais un calcul qu'il peut refaire. */}
      <Hero label="Ce qui te revient" value={group(solde.net)} suffix="FCFA">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
          <span>
            <span className="font-semibold text-ink">{fcfa(solde.brut)}</span> encaissés
          </span>
          <span>
            − <span className="font-semibold text-ink">{fcfa(solde.commission)}</span> de commission (
            {Math.round(COMMISSION_RATE * 100)} %)
          </span>
        </div>
      </Hero>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatBlock label="Articles vendus" value={group(solde.articlesVendus)} hint="depuis toujours" />
        <StatBlock
          label="Commandes"
          value={group(solde.commandes)}
          hint={solde.commandes > 1 ? "payées" : "payée"}
          tone="jade"
        />
        <StatBlock
          label="En vente"
          value={group(actifs)}
          hint={actifs > 1 ? "articles actifs" : "article actif"}
        />
        <StatBlock
          label="En rupture"
          value={group(enRupture)}
          hint={enRupture > 0 ? "à réapprovisionner" : "rien à signaler"}
          tone={enRupture > 0 ? "gold" : undefined}
        />
      </div>

      <Section title="Gérer">
        <Tiles>
          <Tile href="/vendeur/articles" label="Articles" icon={<CartIcon size={17} />} />
          <Tile href="/vendeur/commandes" label="Commandes" icon={<TruckIcon size={17} />} />
        </Tiles>
      </Section>

      <Section title="Dernières ventes" href="/vendeur/commandes">
        {ventes.length === 0 ? (
          <Card tone="dashed" shape="panel" className="px-5 py-10 text-center text-[13px] text-muted">
            Aucune vente pour l&apos;instant.
          </Card>
        ) : null}

        <div className="flex flex-col gap-2">
          {ventes.map(({ item, order, product, client }) => (
            <Card key={item.id} shape="panel" className="flex items-center gap-3 p-3">
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="truncate text-[14px] font-semibold">
                  {item.qty} × {product.name}
                </span>
                <span className="truncate text-[12px] text-muted">
                  {client.name} · {order.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-[14px] font-semibold text-gold-text">
                  {f(item.unitPrice * item.qty - item.commission)}
                </span>
                <span className="text-[11px] text-muted">net</span>
              </span>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
