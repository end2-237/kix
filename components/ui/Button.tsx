import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

type Variant = "primary" | "glass" | "jade" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-gold-ink font-semibold hover:brightness-105",
  glass: "glass text-ink hover:bg-surface-2",
  jade: "glass-jade text-jade-text hover:brightness-110",
  outline: "border border-line text-ink hover:bg-surface",
  ghost: "text-dim hover:text-ink",
};

// Pastilles pour l'action, angles vifs pour la donnée : les deux familles de
// formes du design system.
const sizes: Record<Size, string> = {
  sm: "h-11 px-4 text-[13px] gap-2",
  md: "h-12 px-5 text-sm gap-2",
  lg: "h-14 px-7 text-[15px] gap-2.5",
};

const base =
  "press go inline-flex items-center justify-center rounded-full whitespace-nowrap transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-45 disabled:pointer-events-none";

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading = false,
  children,
  ...rest
}: CommonProps & { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Spinner size={17} /> : null}
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

export function IconButton({ className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "glass press grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-surface-2 hover:text-gold-text",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconLink({ href, className, children, ...rest }: { href: string; className?: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      className={cn(
        "glass press grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-surface-2 hover:text-gold-text",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
