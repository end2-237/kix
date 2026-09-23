import Link from "next/link";
import { AppHeader } from "@/components/mb/AppHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { CoursBannieres, type CoursCarte } from "@/components/mb/CoursBanniere";
import { CartBar } from "@/components/shop/CartBar";
import { Chip } from "@/components/ui/Chip";
import { Recuperation } from "@/components/shop/Recuperation";
import { RechercheBoutique } from "@/components/shop/RechercheBoutique";
import { getProducts, getUnreadCount } from "@/lib/queries";
import { getCourses } from "@/lib/courses";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/cn";

export const metadata = { title: "Master Shop" };

const tabs = [
  { id: "vapes", label: "Vapes & puffs" },
  { id: "billard", label: "Billard" },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const category = cat === "billard" ? "billard" : "vapes";
  const cherche = (q ?? "").trim();
  const user = await requireUser();
  const [products, unread, cours] = await Promise.all([
    getProducts(category, cherche),
    getUnreadCount(user.id),
    getCourses(true),
  ]);
  const cartes: CoursCarte[] = cours.map((c) => ({ ...c, inscrits: Number(c.inscrits) }));

  return (
    <>
      <AppHeader user={user} unread={unread} title="Master Shop" subtitle="Vapes, puffs et matériel de billard livrés à Douala ou retirés en salle." />

      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px]">Master Shop</h1>
          <p className="text-xs text-muted">Vapes &amp; matériel de billard · Douala</p>
        </div>
      </div>

      <RechercheBoutique q={cherche} cat={category} />

      <div className="flex flex-wrap items-center gap-2 lg:justify-between">
        <div className="flex gap-2">
        {tabs.map((tab) => (
          <Link key={tab.id} href={`/app/shop?cat=${tab.id}`}>
            <Chip tone={category === tab.id ? "solid" : "neutral"}>{tab.label}</Chip>
          </Link>
        ))}
      </div>

      <Recuperation />
      </div>

      {cherche ? (
        <p className="text-[13px] text-muted">
          {products.length === 0
            ? `Rien pour « ${cherche} » — essaie un autre mot.`
            : `${products.length} article${products.length > 1 ? "s" : ""} pour « ${cherche} », tous rayons confondus.`}
        </p>
      ) : null}

      {/* Les cours en bannière, au-dessus du rayon : un cours ne se cherche
          pas comme une puff, il se propose. */}
      {cherche ? null : <CoursBannieres cartes={cartes} />}

      <div className={cn("grid gap-3", "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5")}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <CartBar />
    </>
  );
}
