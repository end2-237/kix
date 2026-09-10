"use client";

import Image from "next/image";
import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { ArrowRightIcon, CartIcon, PinIcon, PlusIcon, SearchIcon, TruckIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { f, fcfa, productById, products, type Product } from "@/lib/exports";
import { useKix } from "@/lib/store";

const tabs = [
  { id: "vapes", label: "Vapes & puffs" },
  { id: "billard", label: "Billard" },
] as const;

export default function ShopPage() {
  const { cartItems, cartCount, addToCart } = useKix();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("vapes");
  const [pickup, setPickup] = useState(true);

  const list = products.filter((p) => p.category === tab);
  const total = cartItems.reduce((sum, item) => sum + (productById(item.id)?.price ?? 0) * item.qty, 0);

  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px]">KIX Shop</h1>
          <p className="text-xs text-muted">Vapes &amp; matériel de billard · Douala</p>
        </div>
        <div className="flex gap-2.5">
          <button aria-label="Rechercher" className="glass grid h-11 w-11 place-items-center rounded-[14px]">
            <SearchIcon size={18} />
          </button>
          <span className="glass relative grid h-11 w-11 place-items-center rounded-[14px]">
            <CartIcon size={19} />
            {cartCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-green px-1.5 text-[10px] font-semibold text-green-ink">
                {cartCount}
              </span>
            ) : null}
          </span>
        </div>
      </header>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}>
            <Chip tone={tab === t.id ? "solid" : "neutral"}>{t.label}</Chip>
          </button>
        ))}
        <Chip tone="neutral">E-liquides</Chip>
      </div>

      <div className="glass flex gap-2.5 rounded-2xl p-1.5">
        <ModeTile
          active={pickup}
          onClick={() => setPickup(true)}
          icon={<PinIcon size={15} />}
          label="Retrait en salle · gratuit"
        />
        <ModeTile
          active={!pickup}
          onClick={() => setPickup(false)}
          icon={<TruckIcon size={15} />}
          label={`Livraison · ${f(1000)}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={() => addToCart(product.id)} />
        ))}
      </div>

      {cartCount > 0 ? (
        <div className="fixed inset-x-0 bottom-24 z-20 mx-auto w-full max-w-[430px] px-5">
          <div className="glass-strong flex h-16 items-center gap-3 rounded-card border-green/35 px-4">
            <span className="flex grow flex-col gap-0.5">
              <span className="text-[11px] text-muted">
                Panier · {cartCount} article{cartCount > 1 ? "s" : ""}
              </span>
              <span className="font-display text-[17px]">{fcfa(total)}</span>
            </span>
            <span className="flex h-11 items-center gap-1.5 rounded-[14px] bg-green px-4 text-sm font-semibold text-green-ink">
              Payer
              <ArrowRightIcon size={16} />
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ModeTile({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-11 grow items-center justify-center gap-1.5 rounded-xl text-xs transition",
        active ? "border border-green/40 bg-green/15 font-semibold text-green" : "text-muted hover:text-dim",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const { cart } = useKix();
  const qty = cart[product.id] ?? 0;

  return (
    <div className="glass flex flex-col overflow-hidden rounded-card">
      <div className="relative h-27">
        <Image src={product.image} alt={product.name} fill sizes="180px" className="object-cover" />
        {product.badge ? (
          <span
            className={cn(
              "absolute top-2 left-2 rounded-full px-2 py-1 text-[9px] font-semibold tracking-[0.06em] uppercase",
              product.badge.tone === "green" ? "bg-green/90 text-green-ink" : "bg-violet/90 text-ink",
            )}
          >
            {product.badge.label}
          </span>
        ) : null}
      </div>
      <div className="flex grow flex-col gap-2 px-3 pt-2.5 pb-3">
        <div className="flex grow flex-col gap-1">
          <span className="text-[13px] leading-4 font-semibold">{product.name}</span>
          <span className="text-[11px] text-muted">{product.detail}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-display text-base">{f(product.price)}</span>
          <button
            onClick={onAdd}
            aria-label={`Ajouter ${product.name} au panier`}
            className={cn(
              "grid h-9 w-11 place-items-center rounded-xl border transition",
              qty > 0
                ? "border-green bg-green text-green-ink"
                : "border-green/40 bg-green/15 text-green hover:bg-green/25",
            )}
          >
            {qty > 0 ? <span className="text-[13px] font-semibold">{qty}</span> : <PlusIcon size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
