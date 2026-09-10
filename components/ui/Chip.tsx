import { cn } from "@/lib/cn";

type Tone = "green" | "violet" | "neutral" | "solid" | "amber";

const tones: Record<Tone, string> = {
  green: "bg-green/15 border-green/40 text-green",
  violet: "bg-violet/15 border-violet/40 text-violet-soft",
  neutral: "glass text-dim",
  solid: "bg-ink border-transparent text-night font-semibold",
  amber: "bg-amber/15 border-amber/40 text-amber",
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn("h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_rgba(61,240,138,0.9)]", className)}
    />
  );
}

export function Badge({
  tone = "green",
  className,
  children,
}: {
  tone?: "green" | "violet";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.06em] uppercase",
        tone === "green" ? "bg-green text-green-ink" : "bg-violet text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
