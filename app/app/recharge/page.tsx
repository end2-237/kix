import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { RechargeForm } from "@/components/mb/RechargeForm";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CoinIcon } from "@/components/icons";
import { getPacks, getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Recharger mes jetons" };

export default async function RechargePage() {
  const [packs, venues, user] = await Promise.all([getPacks(), getVenues(), requireUser()]);

  // Sur une base neuve, le catalogue est vide tant que l'administrateur ne l'a
  // pas rempli. Sans ce garde-fou, le formulaire lisait `packs[0].tokens` et la
  // page entière tombait — un écran d'erreur, là où il n'y a qu'un catalogue à
  // remplir.
  const manque = packs.length === 0 ? "pack" : venues.length === 0 ? "salle" : null;

  return (
    <>
      <ScreenHeader title="Recharger mes jetons" subtitle="Paiement Orange Money ou MTN MoMo, jetons crédités dès la validation." />

      {manque ? (
        <Card shape="panel" className="mt-4 flex flex-col items-center gap-4 px-5 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted">
            <CoinIcon size={24} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg">Recharge indisponible</h2>
            <p className="text-[13px] text-muted">
              {manque === "pack"
                ? "Aucun pack de jetons n'est en vente pour l'instant."
                : "Aucune salle partenaire n'est ouverte pour l'instant."}
            </p>
          </div>
          {user.role === "admin" ? (
            <Link
              href={manque === "pack" ? "/admin/packs" : "/admin/salles"}
              className="flex h-12 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
            >
              {manque === "pack" ? "Créer un pack" : "Ajouter une salle"}
              <ArrowRightIcon size={16} />
            </Link>
          ) : (
            <Link
              href="/app"
              className="flex h-12 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
            >
              Retour à l&apos;accueil
              <ArrowRightIcon size={16} />
            </Link>
          )}
        </Card>
      ) : (
        <RechargeForm packs={packs} venues={venues} phone={user.phone} />
      )}
    </>
  );
}
