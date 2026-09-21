import { cn } from "@/lib/cn";

/** Pastille « en direct » : la même partout, pour que l'œil la reconnaisse. */
export function LiveDot({
  connected = true,
  label = "EN DIRECT",
  className,
}: {
  connected?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase",
        connected ? "bg-live/15 text-live" : "bg-surface-2 text-muted",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "live-dot bg-live" : "bg-muted")} />
      {connected ? label : "hors ligne"}
    </span>
  );
}
