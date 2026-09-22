import { DemandeRetrait } from "@/components/caisse/Retrait";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CoinIcon } from "@/components/icons";
import { ETATS_RETRAIT, MOYENS, RETRAIT_MINIMUM, getRecetteSalle, mesRetraits } from "@/lib/caisse";
import { requireRole } from "@/lib/session";
import { displayPhone } from "@/lib/phone";
import { f, fcfa } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "La caisse" };

const jour = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

/**
 * La caisse de la salle.
 *
 * L'argent des jetons, des billets et des inscriptions arrive sur le compte
 * de la plateforme, jamais sur celui du gérant : c'est par ici qu'il revient.
 * La page dit d'où vient chaque franc avant de dire combien on peut retirer —
 * un solde qu'on ne peut pas expliquer n'est pas un solde, c'est un chiffre.
 */
export default async function GerantCaisse() {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) {
    return (
      <Card shape="panel" className="flex flex-col gap-2 p-6">
        <h1 className="text-xl">Aucune salle rattachée</h1>
        <p className="text-[13px] text-muted">Rattache ce compte à une salle pour voir sa caisse.</p>
      </Card>
    );
  }

  const [recette, retraits] = await Promise.all([getRecetteSalle(manager.venueId), mesRetraits(manager.id)]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl lg:text-[26px]">La caisse</h1>
        <p className="text-[13px] text-muted">
          Ce que la salle a encaissé par la plateforme, et ce que tu peux te faire verser.
        </p>
      </header>

      <Card tone="gold" shape="panel" className="flex flex-col gap-4 p-5">
        <span className="label-caps text-[10px]">Disponible</span>
        <span className="text-[42px] leading-none font-bold tracking-[-0.035em] tabular-nums lg:text-[56px]">
          {fcfa(recette.disponible)}
        </span>
        <DemandeRetrait
          disponible={recette.disponible}
          minimum={RETRAIT_MINIMUM}
          phone={manager.phone}
          venueId={manager.venueId}
        />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">D&apos;où vient l&apos;argent</h2>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Poste valeur={recette.jetons} quoi="jetons scannés" />
          <Poste valeur={recette.billets} quoi="billets d'événements" />
          <Poste valeur={recette.tournois} quoi="droits d'inscription" />
          <Poste valeur={recette.reservations} quoi="acomptes de table" />
        </div>

        <Card shape="panel" className="flex flex-col gap-2 p-4 text-[13px]">
          <Ligne libelle="Total encaissé" valeur={recette.brut} fort />
          <Ligne libelle="Déjà versé" valeur={-recette.verse} />
          <Ligne libelle="Demandes en cours" valeur={-recette.enAttente} />
          <div className="border-t border-line pt-2">
            <Ligne libelle="Disponible" valeur={recette.disponible} fort />
          </div>
        </Card>

        <p className="text-[11.5px] leading-5 text-muted">
          Un jeton compte pour ce qu&apos;il a coûté au client, pas pour le tarif du jour : un pack de trois
          jetons à 1 000 F ne fait pas entrer trois fois le prix unitaire. Les billets comptent une fois
          validés, les droits d&apos;inscription une fois réglés.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">Mes demandes</h2>
        {retraits.length === 0 ? (
          <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <span className="grid h-13 w-13 place-items-center rounded-full bg-surface-2 text-muted">
              <CoinIcon size={22} />
            </span>
            <p className="max-w-sm text-[13px] text-muted">
              Aucune demande. Le versement part du compte Master Break vers le numéro que tu indiques.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {retraits.map((r) => (
              <Card key={r.id} shape="panel" className="flex items-center gap-3 px-3.5 py-3">
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="text-[14px] font-semibold tabular-nums">{fcfa(r.amount)}</span>
                  <span className="truncate text-[11.5px] text-muted">
                    {MOYENS[r.method] ?? r.method}
                    {r.phone ? ` · ${displayPhone(r.phone)}` : ""} · demandé le {jour(r.createdAt)}
                    {r.paidAt ? ` · versé le ${jour(r.paidAt)}` : ""}
                    {r.reference ? ` · réf. ${r.reference}` : ""}
                  </span>
                </span>
                <Chip
                  tone={r.status === "paye" ? "jade" : r.status === "refuse" ? "warn" : "neutral"}
                  className="shrink-0 text-[10.5px]"
                >
                  {ETATS_RETRAIT[r.status] ?? r.status}
                </Chip>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Poste({ valeur, quoi }: { valeur: number; quoi: string }) {
  return (
    <Card shape="panel" className="flex flex-col gap-0.5 px-3 py-3">
      <span className="text-[17px] leading-tight font-bold tracking-[-0.02em] tabular-nums">{f(valeur)}</span>
      <span className="text-[11px] leading-tight text-muted">{quoi}</span>
    </Card>
  );
}

function Ligne({ libelle, valeur, fort }: { libelle: string; valeur: number; fort?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={fort ? "font-semibold" : "text-muted"}>{libelle}</span>
      <span className={`tabular-nums ${fort ? "font-semibold" : "text-muted"}`}>{f(valeur)}</span>
    </div>
  );
}
