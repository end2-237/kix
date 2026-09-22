"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MomoCheckout, type Method } from "@/components/mb/MomoCheckout";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { useSnackbar } from "@/components/ui/Snackbar";
import { BoltIcon, CheckIcon } from "@/components/icons";
import { souscrire } from "@/lib/actions";
import { fcfa } from "@/lib/format";
import { cn } from "@/lib/cn";

export type PlanCarte = {
  id: string;
  name: string;
  months: number;
  price: number;
  perks: string[];
  hint: string;
  badge: string | null;
  /** Le prix ramené au mois : c'est ce qui rend deux formules comparables. */
  parMois: number;
};

/**
 * Le choix d'une formule, puis la caisse.
 *
 * Les formules se comparent au mois, pas au total : « 12 000 F l'année »
 * ne se met pas en face de « 1 500 F le mois » sans que quelqu'un fasse la
 * division, et personne ne la fait.
 */
export function Souscrire({
  plans,
  phone,
  membre,
}: {
  plans: PlanCarte[];
  phone: string;
  membre: boolean;
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [choisi, setChoisi] = useState<PlanCarte | null>(null);

  const start = async (numero: string, method: Method) => {
    if (!choisi) return { ok: false as const, error: "Choisis une formule." };
    const res = await souscrire(choisi.id, method, numero);
    if (!res.ok) return res;
    return { ok: true as const, reference: res.reference, instruction: res.instruction };
  };

  return (
    <>
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            shape="panel"
            tone={plan.badge ? "gold" : "glass"}
            className="flex flex-col gap-3.5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-semibold">{plan.name}</span>
                <span className="text-[11.5px] text-muted">
                  {plan.months} mois · {fcfa(plan.parMois)} par mois
                </span>
              </span>
              {plan.badge ? (
                <Chip tone="solid" className="shrink-0 text-[10px] tracking-[0.06em] uppercase">
                  {plan.badge}
                </Chip>
              ) : null}
            </div>

            <span className="text-[26px] leading-none font-bold tracking-[-0.03em]">{fcfa(plan.price)}</span>

            {plan.perks.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[12.5px] text-dim">
                    <CheckIcon size={14} className="mt-0.5 shrink-0 text-gold-text" />
                    {perk}
                  </li>
                ))}
              </ul>
            ) : null}

            {plan.hint ? <p className="text-[11.5px] text-muted">{plan.hint}</p> : null}

            <button
              onClick={() => setChoisi(plan)}
              className={cn(
                "press mt-auto flex h-11 items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition",
                plan.badge
                  ? "bg-gold text-gold-ink hover:brightness-105"
                  : "border border-line text-ink hover:bg-surface-2",
              )}
            >
              <BoltIcon size={16} />
              {membre ? "Prolonger" : "M'abonner"}
            </button>
          </Card>
        ))}
      </div>

      <Sheet open={Boolean(choisi)} onClose={() => setChoisi(null)} title={choisi?.name ?? "Abonnement"}>
        {choisi ? (
          <MomoCheckout
            amount={choisi.price}
            defaultPhone={phone}
            start={start}
            onPaid={() => {
              setChoisi(null);
              notify(membre ? "Abonnement prolongé" : "Te voilà abonné", {
                detail: `${choisi.months} mois · ${fcfa(choisi.price)}`,
                tone: "jade",
              });
              router.refresh();
            }}
            hint={`${choisi.months} mois d'accès · aucun renouvellement automatique`}
            label={`Payer · ${fcfa(choisi.price)}`}
          />
        ) : null}
      </Sheet>
    </>
  );
}
