/** Motif de points du design : une trame carrée, calée sur la grille. */
export function DotGrid({ size = 7, className }: { size?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{ display: "grid", gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 6 }}
      aria-hidden="true"
    >
      {Array.from({ length: size * size }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-current opacity-70" />
      ))}
    </div>
  );
}
