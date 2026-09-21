import Link from "next/link";
import { cn } from "@/lib/cn";

/** Un titre de section, et le lien qui mène au détail. */
export function Section({
  title,
  href,
  action = "Tout voir",
  children,
  className,
}: {
  title: string;
  href?: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold lg:text-[17px]">{title}</h2>
        {href ? (
          <Link href={href} className="press text-[12px] text-gold-text">
            {action}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * La grille de raccourcis, quatre par rangée.
 *
 * C'est ce qui remplace la pile de pastilles qui s'entassait en haut de
 * chaque page d'administration : neuf liens empilés en `flex-wrap` mangeaient
 * la moitié d'un écran de téléphone avant qu'une seule donnée n'apparaisse.
 */
export function Tiles({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-4 gap-2.5">{children}</div>;
}

export function Tile({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Un compteur discret : commandes en attente, places à valider… */
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="press relative flex flex-col items-center gap-2 rounded-panel border border-line bg-surface px-1.5 py-3.5 text-center transition hover:bg-surface-2"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-dim">{icon}</span>
      <span className="text-[10.5px] leading-tight text-dim">{label}</span>
      {badge && badge > 0 ? (
        <span className="absolute top-2 right-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9.5px] font-bold text-gold-ink">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
