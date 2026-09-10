import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { cn } from "@/lib/cn";
import { f } from "@/lib/format";
import type { Product } from "@/db";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="glass lift zoom flex flex-col overflow-hidden rounded-card">
      <Link href={`/app/shop/${product.slug}`} className="relative block h-27 overflow-hidden lg:h-52">
        <Image src={product.image} alt={product.name} fill sizes="180px" className="object-cover" />
        {product.badgeLabel ? (
          <span
            className={cn(
              "absolute top-2 left-2 rounded-full px-2 py-1 text-[9px] font-semibold tracking-[0.06em] uppercase",
              product.badgeTone === "green" ? "bg-green text-green-ink" : "bg-violet text-white",
            )}
          >
            {product.badgeLabel}
          </span>
        ) : null}
      </Link>
      <div className="flex grow flex-col gap-2 px-3 pt-2.5 pb-3">
        <Link href={`/app/shop/${product.slug}`} className="flex grow flex-col gap-1">
          <span className="text-[13px] leading-4 font-semibold lg:text-[15px] lg:leading-5">{product.name}</span>
          <span className="text-[11px] text-muted">{product.detail}</span>
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold tracking-[-0.03em]">{f(product.price)}</span>
          <AddToCartButton slug={product.slug} name={product.name} price={product.price} />
        </div>
      </div>
    </div>
  );
}
