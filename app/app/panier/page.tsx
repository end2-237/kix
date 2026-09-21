import { ScreenHeader } from "@/components/mb/AppHeader";
import { CartClient } from "@/components/shop/CartClient";
import { getProducts, getVenues } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panier" };

export default async function PanierPage() {
  const [products, venues] = await Promise.all([getProducts(), getVenues()]);
  return (
    <>
      <ScreenHeader title="Mon panier" subtitle="Retrait gratuit en salle ou livraison à Douala." back="/app/shop" />
      <CartClient products={products} venues={venues} />
    </>
  );
}
