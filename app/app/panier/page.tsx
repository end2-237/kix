import { ScreenHeader } from "@/components/mb/AppHeader";
import { CartClient } from "@/components/shop/CartClient";
import { getDeclinaisons, getProducts, getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panier" };

export default async function PanierPage() {
  const [products, variantes, venues, user] = await Promise.all([
    getProducts(),
    getDeclinaisons(),
    getVenues(),
    requireUser(),
  ]);
  return (
    <>
      <ScreenHeader title="Mon panier" subtitle="Retrait gratuit en salle ou livraison à Douala." back="/app/shop" />
      <CartClient products={products} variantes={variantes} venues={venues} phone={user.phone} />
    </>
  );
}
