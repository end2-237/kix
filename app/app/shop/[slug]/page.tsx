import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { CartBar } from "@/components/shop/CartBar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CheckIcon, PinIcon, TruckIcon } from "@/components/icons";
import { getProduct, getProducts } from "@/lib/queries";
import { f } from "@/lib/format";
import { DELIVERY_FEE } from "@/lib/constants";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? "Produit" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.active) notFound();

  const others = (await getProducts(product.category)).filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <>
      <ScreenHeader
        title={product.category === "vapes" ? "Vapes & puffs" : "Billard"}
        subtitle="Master Shop · Douala"
        back="/app/shop"
      />

      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-10">
      <div className="relative h-64 overflow-hidden rounded-panel border border-line lg:sticky lg:top-8 lg:h-125">
        <Photo src={product.image} alt={product.name} fill sizes="430px" className="object-cover" priority />
        {product.badgeLabel ? (
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.06em] uppercase",
              product.badgeTone === "gold" ? "bg-gold text-gold-ink" : "bg-jade text-white",
            )}
          >
            {product.badgeLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3.5 lg:gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[26px] leading-7 lg:text-[34px] lg:leading-9">{product.name}</h1>
          <span className="shrink-0 text-[22px] font-bold tracking-[-0.03em] text-gold-text lg:text-[28px]">{f(product.price)}</span>
        </div>
        <p className="text-[13px] text-muted">{product.detail}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip tone={product.stock > 0 ? "gold" : "warn"}>
          {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
        </Chip>
        <Chip tone="neutral">Retrait gratuit en salle</Chip>
        <Chip tone="neutral">Livraison {f(DELIVERY_FEE)}</Chip>
      </div>

      <p className="text-[14px] leading-6 text-dim text-pretty">{product.description}</p>

      <Card shape="square" className="flex flex-col divide-y divide-line">
        <Row icon={<PinIcon size={17} />} title="Retrait en salle" detail="Prêt sous 2 h au Break Akwa, gratuit." />
        <Row icon={<TruckIcon size={17} />} title="Livraison Douala" detail={`${f(DELIVERY_FEE)} · le soir même avant 20 h.`} />
        <Row icon={<CheckIcon size={17} />} title="Paiement Mobile Money" detail="Orange Money ou MTN MoMo à la commande." />
      </Card>

      <div className="hidden lg:flex">
        <AddToCartButton slug={product.slug} name={product.name} price={product.price} full />
      </div>
      </div>
      </div>

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

      <div className="fixed inset-x-0 bottom-24 z-20 mx-auto flex w-full max-w-[430px] gap-3 px-5 lg:hidden">
        <AddToCartButton slug={product.slug} name={product.name} price={product.price} full />
      </div>

      <CartBar />
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
