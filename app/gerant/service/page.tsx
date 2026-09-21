import { Card, StatBlock } from "@/components/ui/Card";
import { Counter } from "@/components/ui/Counter";
import { getShift } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { f, fcfa } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Le service" };

export default async function ServicePage() {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) {
    return (
      <Card shape="panel" className="flex flex-col gap-2 p-6">
        <h1 className="text-xl">Aucune salle rattachée</h1>
        <p className="text-[13px] text-muted">Rattache ce compte à une salle pour suivre son service.</p>
      </Card>
    );
  }

  const shift = await getShift(manager.venueId);

  // On n'affiche que les heures d'ouverture réelles : minuit à midi est vide.
  const active = shift.hours.filter((h) => h.hour >= 11 || h.revenue > 0);
  const peak = Math.max(1, ...active.map((h) => h.revenue));
  const best = active.reduce((a, b) => (b.revenue > a.revenue ? b : a), active[0]);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl lg:text-[26px]">Le service</h1>
          <p className="text-[13px] text-muted">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })} ·
            depuis minuit.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatBlock
          label="Recette comptoir"
          value={
            <>
              <Counter value={shift.revenue} format="grouped" /> F
            </>
          }
          hint={`${shift.tokens} jetons débités`}
          tone="gold"
          className="rounded-none"
        />
        <StatBlock
          label="Acomptes encaissés"
          value={
            <>
              <Counter value={shift.deposits} format="grouped" /> F
            </>
          }
          hint="déduits des notes"
          className="rounded-none"
        />
        <StatBlock
          label="Occupation"
          value={
            <>
              <Counter value={shift.occupancy} /> %
            </>
          }
          hint="des tables sur 12 h"
          tone="jade"
          className="rounded-none"
        />
        <StatBlock
          label="Réservations"
          value={`${shift.seated + shift.reserved}`}
          hint={shift.noShow > 0 ? `${shift.noShow} absent${shift.noShow > 1 ? "s" : ""}` : "aucun absent"}
          className="rounded-none"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card shape="panel" className="flex flex-col gap-5 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[17px]">Recette heure par heure</h2>
            {best?.revenue ? (
              <span className="text-[12px] text-gold-text">
                Pic à {String(best.hour).padStart(2, "0")} h · {fcfa(best.revenue)}
              </span>
            ) : null}
          </div>

          {/* Barres proportionnelles : la lecture d'un service tient en un coup d'œil. */}
          <div className="flex h-52 items-end gap-1.5">
            {active.map((h) => (
              <div key={h.hour} className="group flex grow flex-col items-center gap-2">
                <span className="text-[10px] text-dim opacity-0 transition group-hover:opacity-100">
                  {h.revenue ? f(h.revenue) : ""}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-[3px] transition-all duration-500",
                    h.revenue ? "bg-gold/75 group-hover:bg-gold" : "bg-surface-2",
                  )}
                  style={{ height: `${Math.max(2, (h.revenue / peak) * 100)}%` }}
                  title={`${String(h.hour).padStart(2, "0")} h · ${fcfa(h.revenue)} · ${h.scans} passages`}
                />
                <span className="text-[9.5px] text-muted tabular-nums">{String(h.hour).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card shape="panel" className="flex flex-col gap-3 p-5">
            <h2 className="text-[17px]">Le client du soir</h2>
            {shift.best ? (
              <>
                <span className="text-[24px] font-bold tracking-[-0.03em]">{shift.best.name}</span>
                <span className="text-[13px] text-muted">
                  {shift.best.scans} parties lancées ici depuis minuit.
                </span>
              </>
            ) : (
              <span className="text-[13px] text-muted">Pas encore de passage aujourd&apos;hui.</span>
            )}
          </Card>

          <Card shape="panel" className="flex flex-col gap-3 p-5">
            <h2 className="text-[17px]">À verser</h2>
            <div className="flex flex-col gap-2 text-[13px]">
              <Row label="Jetons" value={fcfa(shift.revenue)} />
              <Row label="Acomptes" value={fcfa(shift.deposits)} />
              <div className="mt-1 flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-semibold">Total du service</span>
                <span className="text-[20px] font-bold tracking-[-0.03em] text-gold-text">
                  {fcfa(shift.revenue + shift.deposits)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted">Versement Master Break le lundi suivant.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
