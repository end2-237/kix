"use client";

import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MomoCheckout, type Method } from "@/components/mb/MomoCheckout";
import { Card } from "@/components/ui/Card";
import { useSnackbar } from "@/components/ui/Snackbar";
import { ArrowRightIcon, CartIcon, CheckIcon, MinusIcon, PinIcon, PlusIcon, TruckIcon } from "@/components/icons";
import { checkout } from "@/lib/actions";
import { clearCart, setQty, useCart, useRecuperation } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { Counter } from "@/components/ui/Counter";
import { f, fcfa } from "@/lib/format";
import { DELIVERY_FEE } from "@/lib/constants";
import type { Product, ProductVariant, Venue } from "@/db";

export function CartClient({
  products,
  variantes,
  venues,
  phone,
}: {
  products: Product[];
  variantes: ProductVariant[];
  venues: Venue[];
  phone: string;
}) {
  const { list, count } = useCart();
  const { notify } = useSnackbar();
  const router = useRouter();
  // Le mode choisi au rayon se retrouve ici : c'est le même réglage.
  const { mode: fulfillment, setRecuperation: setFulfillment } = useRecuperation();
  const [method, setMethod] = useState<Method>("momo");
  const [done, setDone] = useState<{ total: number } | null>(null);

  // Une ligne, c'est un article ET sa déclinaison : deux saveurs du même
  // article sont deux lignes, avec chacune sa quantité et son prix.
  const lines = list
    .map((item) => {
      const product = products.find((p) => p.slug === item.slug);
      if (!product) return null;
      const variante = item.variantId ? (variantes.find((v) => v.id === item.variantId) ?? null) : null;
      // Une déclinaison disparue du catalogue ne doit pas se vendre au prix
      // de l'article : on laisse la ligne visible, le panier la refusera.
      const introuvable = Boolean(item.variantId) && !variante;
      return {
        cle: item.cle,
        product,
        variante,
        introuvable,
        qty: item.qty,
        prix: variante?.price ?? product.price,
        image: variante?.image ?? product.image,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const subtotal = lines.reduce((sum, l) => sum + (l.introuvable ? 0 : l.prix * l.qty), 0);
  const shipping = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + shipping;

  // Le panier n'est vidé qu'à la confirmation : un paiement refusé laisse le
  // client avec ses articles, prêt à réessayer.
  const start = async (phoneNumber: string, chosen: Method) => {
    setMethod(chosen);
    return checkout(
      lines.filter((l) => !l.introuvable).map((l) => ({ slug: l.product.slug, qty: l.qty, variantId: l.variante?.id })),
      fulfillment,
      chosen,
      phoneNumber,
      venues[0]?.id,
    );
  };

  function onPaid() {
    clearCart();
    setDone({ total });
    notify("Commande confirmée", { detail: fcfa(total) });
    router.refresh();
  }

  if (done) {
    return (
      <Card tone="gold" shape="panel" className="mt-4 flex flex-col items-center gap-4 px-5 py-9 text-center lg:mx-auto lg:max-w-xl lg:py-14">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gold text-gold-ink">
          <CheckIcon size={30} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[22px]">Commande confirmée</h2>
          <p className="text-[13px] text-dim">
            {fcfa(done.total)} payés par {method === "om" ? "Orange Money" : "MTN MoMo"} ·{" "}
            {fulfillment === "pickup" ? "retrait en salle" : "livraison Douala"}
          </p>
        </div>
        <Link
          href="/app/commandes"
          className="flex h-12 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
        >
          Suivre ma commande
          <ArrowRightIcon size={16} />
        </Link>
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card shape="panel" className="mt-4 flex flex-col items-center gap-4 px-5 py-10 text-center lg:mx-auto lg:max-w-xl lg:py-16">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted">
          <CartIcon size={24} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg">Panier vide</h2>
          <p className="text-[13px] text-muted">Les puffs et le matériel t&apos;attendent au Shop.</p>
        </div>
        <Link
          href="/app/shop"
          className="flex h-12 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
        >
          Aller au Shop
          <ArrowRightIcon size={16} />
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-3.5 lg:grid-cols-3 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-2.5 lg:col-span-2 lg:gap-4">
        {lines.map(({ cle, product, variante, introuvable, qty, prix, image }) => (
          <div key={cle} className="glass lift flex items-center gap-3 rounded-card p-3">
            <Link href={`/app/shop/${product.slug}`}>
              <Photo
                src={image}
                alt={product.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-card object-cover lg:h-20 lg:w-20"
              />
            </Link>
            <div className="flex min-w-0 grow flex-col gap-1">
              <span className="truncate text-[13px] font-semibold">{product.name}</span>
              {variante ? (
                <span className="truncate text-[11px] text-gold-text">{variante.name}</span>
              ) : null}
              {introuvable ? (
                <span className="text-[11px] text-warn">Cette déclinaison n&apos;est plus au catalogue.</span>
              ) : (
                <>
                  <span className="text-[11px] text-muted">{f(prix)} l&apos;unité</span>
                  <span className="text-[13px] font-bold">{f(prix * qty)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQty(cle, qty - 1)}
                aria-label="Retirer un article"
                className="glass press grid h-9 w-9 place-items-center rounded-full hover:text-gold-text"
              >
                <MinusIcon size={14} />
              </button>
              <span key={qty} className="pop w-5 text-center text-[13px] font-semibold">{qty}</span>
              <button
                onClick={() => setQty(cle, qty + 1)}
                aria-label="Ajouter un article"
                className="press grid h-9 w-9 place-items-center rounded-full bg-gold text-gold-ink hover:brightness-105"
              >
                <PlusIcon size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3.5 lg:sticky lg:top-8 lg:gap-5">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-base">Récupération</h2>
        <div className="glass flex gap-2.5 rounded-full p-1.5">
          <Toggle
            active={fulfillment === "pickup"}
            onClick={() => setFulfillment("pickup")}
            icon={<PinIcon size={15} />}
            label="Retrait · gratuit"
          />
          <Toggle
            active={fulfillment === "delivery"}
            onClick={() => setFulfillment("delivery")}
            icon={<TruckIcon size={15} />}
            label={`Livraison · ${f(DELIVERY_FEE)}`}
          />
        </div>
      </div>

      <Card shape="square" tone="dashed" className="flex flex-col gap-2 px-4 py-3.5">
        <Line label="Sous-total" value={fcfa(subtotal)} />
        <Line label={fulfillment === "pickup" ? "Retrait en salle" : "Livraison Douala"} value={shipping ? fcfa(shipping) : "Gratuit"} />
        <div className="mt-1 flex items-center justify-between border-t border-line pt-2.5">
          <span className="text-[13px] font-semibold">Total</span>
          <span className="text-[22px] font-bold tracking-[-0.03em]">
            <Counter value={total} format="grouped" duration={450} /> FCFA
          </span>
        </div>
      </Card>

      <MomoCheckout
        amount={total}
        defaultPhone={phone}
        start={start}
        onPaid={onPaid}
        hint={fulfillment === "pickup" ? "Retrait en salle" : "Livraison Douala"}
      />
      </div>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press flex h-11 grow items-center justify-center gap-1.5 rounded-full text-xs transition",
        active ? "border border-gold/40 bg-gold/15 font-semibold text-gold-text" : "glass text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
