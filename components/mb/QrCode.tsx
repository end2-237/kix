import { cn } from "@/lib/cn";
import type { QrShape } from "@/lib/qr";

/** Affiche un QR déjà encodé (voir lib/qr.ts). Toujours sur fond blanc. */
export function QrCode({ shape, size = 196, className }: { shape: QrShape; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${shape.total} ${shape.total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code du jeton"
      className={cn("rounded-lg", className)}
    >
      <rect width={shape.total} height={shape.total} fill="#ffffff" />
      <path d={shape.path} fill="#0b0b0d" />
    </svg>
  );
}
