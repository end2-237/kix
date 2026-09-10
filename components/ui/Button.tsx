import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "glass" | "violet" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-green text-green-ink font-semibold hover:brightness-105 shadow-[0_12px_30px_rgba(61,240,138,0.24)]",
  glass: "glass text-ink hover:bg-white/10",
  violet: "glass-violet text-violet-soft hover:bg-violet/20",
  ghost: "text-dim hover:text-ink",
};

const sizes: Record<Size, string> = {
  // 44px minimum : la cible tactile de référence du design system
  sm: "h-11 px-4 text-sm rounded-[14px] gap-2",
  md: "h-12 px-5 text-sm rounded-2xl gap-2",
  lg: "h-14 px-6 text-base rounded-[18px] gap-2.5",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap transition select-none active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

/** Bouton carré d'icône (44px), pour les en-têtes. */
export function IconButton({
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "glass grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-ink transition hover:bg-white/10",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "glass grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-ink transition hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}
