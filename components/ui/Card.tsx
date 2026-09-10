import { cn } from "@/lib/cn";

type Tone = "glass" | "green" | "violet" | "dashed";

const tones: Record<Tone, string> = {
  glass: "glass",
  green: "glass-green",
  violet: "glass-violet",
  dashed: "bg-white/[0.04] border border-dashed border-white/15",
};

export function Card({
  tone = "glass",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("rounded-card", tones[tone], className)}>{children}</div>;
}

export function SectionTitle({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base">{title}</h2>
      {action ? (
        href ? (
          <a href={href} className="text-xs text-green">
            {action}
          </a>
        ) : (
          <span className="text-xs text-green">{action}</span>
        )
      ) : null}
    </div>
  );
}
