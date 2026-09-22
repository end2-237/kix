import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { Souscrire, type PlanCarte } from "@/components/membre/Souscrire";
import { Card } from "@/components/ui/Card";
import { BoltIcon, LockIcon } from "@/components/icons";
import { avantages, estMembre, joursRestants, getPlans, mesAbonnements } from "@/lib/membres";
import { requireUser } from "@/lib/session";
import { f, fcfa } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Abonnement Master Break" };

const jour = (d: Date | null) =>
  d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default async function AbonnementPage() {
  const user = await requireUser();
  const [plans, historique] = await Promise.all([getPlans(), mesAbonnements(user.id)]);

  const membre = estMembre(user);
  const restants = joursRestants(user);

  const cartes: PlanCarte[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    months: p.months,
    price: p.price,
    perks: avantages(p),
    hint: p.hint,
    badge: p.badge,
    parMois: Math.round(p.price / Math.max(1, p.months)),
  }));

  const regles = historique.filter((h) => h.membership.status === "paid");

  return (
    <>
      <ScreenHeader
        title="Abonnement Master Break"
        subtitle="Tous les directs, sans billet à l'unité."
        action={
          <Link href="/direct" className="press text-[12px] text-gold-text">
            Les directs
          </Link>
        }
      />

      {membre ? (
        <Card tone="gold" shape="panel" className="flex items-center gap-3.5 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-gold-ink">
            <BoltIcon size={22} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="label-caps text-[10px]">Abonné</span>
            <span className="truncate text-[15px] font-semibold">jusqu&apos;au {jour(user.memberUntil)}</span>
            <span className="text-[11.5px] text-muted">
              {restants} jour{restants > 1 ? "s" : ""} restant{restants > 1 ? "s" : ""}
            </span>
          </span>
        </Card>
      ) : (
        <Card shape="panel" className="flex items-start gap-3.5 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
            <LockIcon size={18} />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[14px] font-semibold">Pas encore abonné</span>
            <span className="text-[12.5px] leading-5 text-muted">
              Les directs réservés aux abonnés restent fermés, et les directs payants se prennent au billet.
            </span>
          </span>
        </Card>
      )}

      {cartes.length === 0 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-12 text-center text-[13px] text-muted">
          Aucune formule proposée pour l&apos;instant.
        </Card>
      ) : (
        <Souscrire plans={cartes} phone={user.phone} membre={membre} />
      )}

      {/* Dit une fois, clairement : c'est la question que tout le monde se
          pose devant un abonnement payé par téléphone. */}
      <p className="text-[12px] leading-5 text-muted">
        Rien ne se reconduit tout seul. L&apos;abonnement court jusqu&apos;à sa date de fin, et c&apos;est à
        toi de le reprendre — un abonnement repris avant l&apos;échéance prolonge le précédent, tu ne perds
        aucun jour.
      </p>

      {regles.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold">Mes abonnements</h2>
          <div className="flex flex-col gap-2">
            {regles.map(({ membership, plan }) => (
              <Card key={membership.id} shape="panel" className="flex items-center gap-3 px-3.5 py-3">
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-[13.5px] font-semibold">
                    {plan?.name ?? `${membership.months} mois`}
                  </span>
                  <span className="truncate text-[11.5px] text-muted">
                    du {jour(membership.startsAt)} au {jour(membership.endsAt)}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-gold-text">
                  {f(membership.price)}
                </span>
              </Card>
            ))}
          </div>
          <p className="text-[11.5px] text-muted">
            Total réglé : {fcfa(regles.reduce((n, r) => n + r.membership.price, 0))}
          </p>
        </section>
      ) : null}
    </>
  );
}
