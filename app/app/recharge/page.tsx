import { ScreenHeader } from "@/components/mb/AppHeader";
import { RechargeForm } from "@/components/mb/RechargeForm";
import { getPacks, getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Recharger mes jetons" };

export default async function RechargePage() {
  const [packs, venues, user] = await Promise.all([getPacks(), getVenues(), requireUser()]);

  return (
    <>
      <ScreenHeader title="Recharger mes jetons" subtitle="Paiement Orange Money ou MTN MoMo, jetons crédités dès la validation." />
      <RechargeForm packs={packs} venues={venues} phone={user.phone} />
    </>
  );
}
