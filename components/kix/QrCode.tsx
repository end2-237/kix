import QRCode from "qrcode";
import { cn } from "@/lib/cn";

/**
 * QR réellement encodé (pas un motif décoratif) : le gérant scanne
 * `kix://jeton/<code>` et l'app de caisse débite le jeton correspondant.
 */
export function QrCode({
  value,
  size = 196,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const modules = qr.modules;
  const quiet = 2;
  const total = modules.size + quiet * 2;

  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.data[row * modules.size + col]) {
        path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code du jeton ${value}`}
      className={cn("rounded-lg", className)}
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={path} fill="#0b0b0d" />
    </svg>
  );
}
