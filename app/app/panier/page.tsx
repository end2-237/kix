import { ScreenHeader } from "@/components/kix/AppHeader";
import { CartClient } from "@/components/shop/CartClient";
import { getProducts, getVenues } from "@/lib/queries";

export const metadata = { title: "Panier" };

export default async function PanierPage() {
  const [products, venues] = await Promise.all([getProducts(), getVenues()]);
  return (
    <>
      <ScreenHeader title="Mon panier" back="/app/shop" />
      <CartClient products={products} venues={venues} />
    </>
  );
}
