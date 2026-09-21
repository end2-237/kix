import Link from "next/link";
import { AppHeader } from "@/components/mb/AppHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { CartBar } from "@/components/shop/CartBar";
import { Chip } from "@/components/ui/Chip";
import { PinIcon, SearchIcon, TruckIcon } from "@/components/icons";
import { getProducts, getUnreadCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/cn";
import { f } from "@/lib/format";
import { DELIVERY_FEE } from "@/lib/constants";

export const metadata = { title: "Master Shop" };

const tabs = [
  { id: "vapes", label: "Vapes & puffs" },
  { id: "billard", label: "Billard" },
];

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const category = cat === "billard" ? "billard" : "vapes";
  const user = await requireUser();
  const [products, unread] = await Promise.all([getProducts(category), getUnreadCount(user.id)]);

  return (
    <>
      <AppHeader user={user} unread={unread} title="Master Shop" subtitle="Vapes, puffs et matériel de billard livrés à Douala ou retirés en salle." />

      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px]">Master Shop</h1>
          <p className="text-xs text-muted">Vapes &amp; matériel de billard · Douala</p>
        </div>
        <button aria-label="Rechercher" className="glass grid h-11 w-11 place-items-center rounded-full">
          <SearchIcon size={18} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-between">
        <div className="flex gap-2">
        {tabs.map((tab) => (
          <Link key={tab.id} href={`/app/shop?cat=${tab.id}`}>
            <Chip tone={category === tab.id ? "solid" : "neutral"}>{tab.label}</Chip>
          </Link>
        ))}
      </div>

      <div className="glass flex gap-2.5 rounded-full p-1.5">
        <span className="flex h-11 grow items-center justify-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 text-xs font-semibold text-gold-text">
          <PinIcon size={15} />
          Retrait en salle · gratuit
        </span>
        <span className="flex h-11 grow items-center justify-center gap-1.5 rounded-full text-xs text-muted">
          <TruckIcon size={15} />
          Livraison · {f(DELIVERY_FEE)}
        </span>
      </div>
      </div>

      <div className={cn("grid gap-3", "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5")}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <CartBar />
    </>
  );
}
