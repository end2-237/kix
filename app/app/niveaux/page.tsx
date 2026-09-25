import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { Card } from "@/components/ui/Card";
import { BoltIcon, CheckIcon, TrophyIcon } from "@/components/icons";
import { PALIERS, niveauDe } from "@/lib/niveaux";
import { levelFor } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { group } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Les niveaux" };

/**
 * Ce que le classement ouvre.
 *
 * Un privilège que personne ne connaît ne fait revenir personne. La page dit,
 * palier par palier, ce qu'on gagne le droit de faire — et où l'on en est.
 */
export default async function Niveaux() {
  const moi = await requireUser();
  const mien = niveauDe(moi.points);
  const { next } = levelFor(moi.points);

  return (
    <>
      <ScreenHeader
        title="Les niveaux"
        subtitle="Chaque partie scannée compte. Voilà ce que ça ouvre."
        back="/app/rewards"
      />

      <Card tone="gold" shape="panel" className="flex items-center gap-3.5 p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-gold-ink">
          <TrophyIcon size={22} />
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="text-[15px] font-semibold">
            Niveau {mien} · {PALIERS.find((p) => p.niveau === mien)?.nom}
          </span>
          <span className="text-[12px] text-muted">
            {group(moi.points)} points
            {next ? ` · encore ${group(next.from - moi.points)} pour ${next.name}` : " · tu es au sommet"}
          </span>
        </span>
      </Card>

      <div className="flex flex-col gap-2.5">
        {PALIERS.map((p) => {
          const obtenu = mien >= p.niveau;
          return (
            <Card
              key={p.niveau}
              shape="panel"
              tone={obtenu ? "glass" : "dashed"}
              className="flex flex-col gap-2.5 p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold",
                    obtenu ? "bg-gold/15 text-gold-text" : "bg-surface-2 text-muted",
                  )}
                >
                  {obtenu ? <CheckIcon size={16} /> : p.niveau}
                </span>
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="text-[14.5px] font-semibold">{p.nom}</span>
                  <span className="text-[11.5px] text-muted">
                    {p.points === 0 ? "dès l'inscription" : `${group(p.points)} points`}
                  </span>
                </span>
                {!obtenu ? (
                  <span className="shrink-0 text-[11.5px] text-muted">
                    encore {group(p.points - moi.points)}
                  </span>
                ) : null}
              </div>

              <ul className="flex flex-col gap-1 border-t border-line pt-2.5">
                {p.avantages.map((a) => (
                  <li key={a} className={cn("text-[12.5px] leading-5", obtenu ? "text-dim" : "text-muted")}>
                    · {a}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card shape="panel" className="flex flex-col gap-1.5 p-4">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <BoltIcon size={15} /> Comment monter
        </span>
        <p className="text-[12.5px] leading-5 text-muted">
          Chaque jeton scanné à une table rapporte des points. Un tournoi disputé en rapporte davantage, et le
          gagner beaucoup plus. Rien ne s&apos;achète : le classement ne récompense que ce qui se joue.
        </p>
        <Link href="/app/classement" className="press w-fit text-[12.5px] text-gold-text">
          Voir le classement →
        </Link>
      </Card>
    </>
  );
}
