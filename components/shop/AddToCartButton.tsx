"use client";

import { CheckIcon, PlusIcon } from "@/components/icons";
import { useSnackbar } from "@/components/ui/Snackbar";
import { addToCart, useCart } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { f } from "@/lib/format";

type Props = { slug: string; name: string; price: number; qty?: number; full?: boolean; className?: string };

/** Ajout au panier + snackbar de confirmation. */
export function AddToCartButton({ slug, name, price, qty = 1, full = false, className }: Props) {
  const { notify } = useSnackbar();
  const { items } = useCart();
  const inCart = items[slug] ?? 0;

  function add() {
    addToCart(slug, qty);
    notify("Ajouté au panier", { detail: `${name} · ${f(price * qty)}` });
  }

  if (full) {
    return (
      <button
        onClick={add}
        className={cn(
          "press flex h-14 grow items-center justify-center gap-2.5 rounded-full bg-gold px-6 text-[15px] font-semibold text-gold-ink transition hover:brightness-105",
          className,
        )}
      >
        {inCart > 0 ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
        {inCart > 0 ? `Dans le panier (${inCart})` : "Ajouter au panier"}
      </button>
    );
  }

  return (
    <button
      onClick={add}
      aria-label={`Ajouter ${name} au panier`}
      className={cn(
        "press grid h-9 w-11 place-items-center rounded-full border transition",
        inCart > 0
          ? "border-gold bg-gold text-gold-ink"
          : "border-gold/40 bg-gold/15 text-gold-text hover:bg-gold/25",
        className,
      )}
    >
      {inCart > 0 ? (
        <span key={inCart} className="pop text-[13px] font-semibold">
          {inCart}
        </span>
      ) : (
        <PlusIcon size={15} />
      )}
    </button>
  );
}
