import { cn } from "@/lib/cn";

type Tone = "glass" | "green" | "violet" | "dashed" | "plain";
type Shape = "card" | "square" | "panel";

const tones: Record<Tone, string> = {
  glass: "glass",
  green: "glass-green",
  violet: "glass-violet",
  dashed: "border border-dashed border-line bg-surface",
  plain: "bg-surface-2",
};

const shapes: Record<Shape, string> = {
  card: "rounded-card",
  square: "rounded-none",
  panel: "rounded-panel",
};

export function Card({
  tone = "glass",
  shape = "card",
  className,
  children,
}: {
  tone?: Tone;
  shape?: Shape;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(shapes[shape], tones[tone], className)}>{children}</div>;
}

export function SectionTitle({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base">{title}</h2>
      {action ? (
        href ? (
          <a href={href} className="text-xs text-green-text">
            {action}
          </a>
        ) : (
          <span className="text-xs text-green-text">{action}</span>
        )
      ) : null}
    </div>
  );
}

/** Bloc de chiffre : angles vifs, filet net — la « donnée » du design system. */
export function StatBlock({
  label,
  value,
  hint,
  tone = "glass",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 px-4 py-4", tones[tone], className)}>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-[26px] font-bold tracking-[-0.03em]">{value}</span>
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </div>
  );
}
