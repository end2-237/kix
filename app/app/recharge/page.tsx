import { ScreenHeader } from "@/components/mb/AppHeader";
import { RechargeForm } from "@/components/mb/RechargeForm";
import { getPacks, getVenues } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Recharger mes jetons" };

export default async function RechargePage() {
  const [packs, venues] = await Promise.all([getPacks(), getVenues()]);

  return (
    <>
      <ScreenHeader title="Recharger mes jetons" subtitle="Paiement Orange Money ou MTN MoMo, jetons crédités aussitôt." />
      <RechargeForm packs={packs} venues={venues} />
    </>
  );
}
