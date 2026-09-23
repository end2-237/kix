import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { FicheArticle } from "@/components/shop/FicheArticle";
import { CartBar } from "@/components/shop/CartBar";
import { Card } from "@/components/ui/Card";
import { CheckIcon, PinIcon, TruckIcon } from "@/components/icons";
import { getFicheProduit, getProduct, getProducts } from "@/lib/queries";
import { f } from "@/lib/format";
import { DELIVERY_FEE } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? "Produit" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fiche = await getFicheProduit(slug);
  if (!fiche || !fiche.produit.active) notFound();
  const { produit: product, galerie, declinaisons } = fiche;

  const others = (await getProducts(product.category)).filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <>
      <ScreenHeader
        title={product.category === "vapes" ? "Vapes & puffs" : "Billard"}
        subtitle="Master Shop · Douala"
        back="/app/shop"
      />

      <FicheArticle produit={product} galerie={galerie} declinaisons={declinaisons} />

      <Card shape="square" className="flex flex-col divide-y divide-line">
        <Row icon={<PinIcon size={17} />} title="Retrait en salle" detail="Prêt sous 2 h au Break Akwa, gratuit." />
        <Row icon={<TruckIcon size={17} />} title="Livraison Douala" detail={`${f(DELIVERY_FEE)} · le soir même avant 20 h.`} />
        <Row icon={<CheckIcon size={17} />} title="Paiement Mobile Money" detail="Orange Money ou MTN MoMo à la commande." />
      </Card>

      {others.length > 0 ? (
        <div className="flex flex-col gap-2.5 lg:gap-4">
          <h2 className="text-base">Dans le même rayon</h2>
          <div className="-mx-5 flex md:-mx-7 gap-3 overflow-x-auto px-5 md:px-7 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
            {others.map((other) => (
              <Link
                key={other.id}
                href={`/app/shop/${other.slug}`}
                className="glass w-40 shrink-0 overflow-hidden rounded-card lg:w-full"
              >
                <div className="relative h-24 lg:h-40">
                  <Photo src={other.image} alt={other.name} fill sizes="160px" className="object-cover" />
                </div>
                <div className="flex flex-col gap-1 px-3 py-2.5">
                  <span className="line-clamp-2 text-[12px] leading-4 font-semibold">{other.name}</span>
                  <span className="text-[12px] font-bold">{f(other.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Le bouton d'achat flotte au-dessus du contenu sur téléphone : sans
          cette réserve, la dernière section — et le choix des saveurs sur une
          fiche courte — se retrouve coincée dessous, intouchable. */}
      <div className="h-32 lg:hidden" aria-hidden />

      {/* Le panier flottant reste sur grand écran, où il vit dans un coin ;
          sur téléphone il ferait doublon avec la barre d'achat de la fiche. */}
      <div className="hidden lg:block">
        <CartBar />
      </div>
    </>
  );
}

function Row({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-gold-text">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold">{title}</span>
        <span className="text-[11px] text-muted">{detail}</span>
      </span>
    </div>
  );
}
