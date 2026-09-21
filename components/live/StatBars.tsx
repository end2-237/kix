"use client";

import { cn } from "@/lib/cn";

export type StatRow = { label: string; a: number; b: number; suffix?: string };

/**
 * Comparaison chiffre par chiffre : une barre partagée entre les deux joueurs,
 * de part et d'autre du libellé. Or à gauche, jade à droite — les deux couleurs
 * de joueur servent partout ailleurs dans l'écran, si bien qu'on lit la barre
 * sans chercher la légende.
 */
export function StatBars({ rows, size = "page" }: { rows: StatRow[]; size?: "page" | "tv" }) {
  const tv = size === "tv";
  return (
    <div className={cn("stagger flex flex-col", tv ? "gap-[2.2vh]" : "gap-4")}>
      {rows.map(({ label, a, b, suffix }) => {
        const total = a + b;
        // À zéro partout, une barre moitié-moitié se lirait comme une égalité
        // disputée : on la laisse vide.
        const share = total === 0 ? 0 : (a / total) * 100;
        return (
          <div key={label} className="flex flex-col gap-1.5">
            <div
              className={cn(
                "flex items-baseline justify-between gap-3",
                tv ? "text-[clamp(16px,1.8vw,32px)]" : "text-[13px]",
              )}
            >
              <span
                className={cn(
                  "font-bold tabular-nums",
                  tv ? "w-[3ch]" : "w-10",
                  a >= b ? "text-gold-text" : "text-muted",
                )}
              >
                {a}
                {suffix}
              </span>
              <span className={cn("label-caps text-muted", tv ? "text-[clamp(11px,1.1vw,20px)]" : "text-[10.5px]")}>
                {label}
              </span>
              <span
                className={cn(
                  "text-right font-bold tabular-nums",
                  tv ? "w-[3ch]" : "w-10",
                  b >= a ? "text-jade-text" : "text-muted",
                )}
              >
                {b}
                {suffix}
              </span>
            </div>

            <div className={cn("flex overflow-hidden rounded-full bg-surface-2", tv ? "h-[1vh] min-h-2" : "h-1.5")}>
              <span
                className="h-full bg-gold transition-all duration-700 ease-out"
                style={{ width: `${share}%` }}
              />
              <span
                className="h-full bg-jade transition-all duration-700 ease-out"
                style={{ width: `${total === 0 ? 0 : 100 - share}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
