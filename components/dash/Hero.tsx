import { cn } from "@/lib/cn";

/**
 * Le chiffre qui compte, en très gros.
 *
 * Un gérant regarde son téléphone debout, entre deux clients : il doit lire
 * sa recette sans chercher. D'où un seul chiffre dominant, et le reste en
 * retrait — les centaines de francs comptent moins que les milliers, alors
 * elles s'affichent plus discrètement.
 */
export function Hero({
  label,
  value,
  suffix,
  faded,
  children,
}: {
  label: string;
  value: string;
  suffix?: string;
  /** La fin du nombre, grisée : les décimales, ou les petits francs. */
  faded?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <span className="text-[12px] tracking-[0.12em] text-muted uppercase">{label}</span>

      <span className="flex items-end gap-1.5 leading-none">
        <span className="text-[44px] font-bold tracking-[-0.035em] tabular-nums lg:text-[62px]">{value}</span>
        {faded ? (
          <span className="text-[30px] font-bold tracking-[-0.03em] text-muted tabular-nums lg:text-[42px]">
            {faded}
          </span>
        ) : null}
        {suffix ? <span className="pb-1.5 text-[17px] font-semibold text-muted lg:pb-2.5">{suffix}</span> : null}
      </span>

      {children}
    </section>
  );
}

/** Les deux ou trois gestes qu'on fait le plus, à portée de pouce. */
export function Quick({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-2.5">{children}</div>;
}

export function QuickAction({
  label,
  icon,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "press flex h-20 flex-col items-center justify-center gap-1.5 rounded-panel border transition",
        accent
          ? "border-gold/40 bg-gold/12 text-gold-text"
          : "border-line bg-surface text-dim hover:bg-surface-2 hover:text-ink",
      )}
    >
      <span className={cn("grid h-8 w-8 place-items-center rounded-full", accent ? "bg-gold text-gold-ink" : "bg-surface-2")}>
        {icon}
      </span>
      <span className="text-[11.5px] leading-tight">{label}</span>
    </span>
  );
}
