/** Bandeau défilant, bord à bord, angles vifs — le liant entre les sections. */
export function Marquee({ items }: { items: string[] }) {
  const strip = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line bg-surface py-3">
      <div className="marquee gap-10">
        {strip.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-10 text-[12px] font-medium tracking-[0.28em] text-muted uppercase"
          >
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          </span>
        ))}
      </div>
    </div>
  );
}
