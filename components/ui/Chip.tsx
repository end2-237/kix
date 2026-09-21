import { cn } from "@/lib/cn";

type Tone = "gold" | "jade" | "neutral" | "solid" | "warn";

const tones: Record<Tone, string> = {
  gold: "bg-gold/15 border-gold/40 text-gold-text",
  jade: "bg-jade/15 border-jade/40 text-jade-text",
  neutral: "glass text-dim",
  solid: "bg-ink border-transparent text-bg font-semibold",
  warn: "bg-warn/15 border-warn/40 text-warn",
};

export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] leading-none transition hover:brightness-110",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("h-1.5 w-1.5 rounded-full bg-gold", className)} />;
}

export function Badge({
  tone = "gold",
  className,
  children,
}: {
  tone?: "gold" | "jade";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.06em] uppercase",
        tone === "gold" ? "bg-gold text-gold-ink" : "bg-jade text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}
