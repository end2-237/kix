import QRCode from "qrcode";

export type QrShape = { path: string; total: number };

/**
 * Encode réellement la valeur puis renvoie un tracé SVG : calculé sur le
 * serveur, le composant d'affichage reste une simple balise <svg>.
 */
export function qrShape(value: string, quiet = 2): QrShape {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.data[row * modules.size + col]) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
    }
  }
  return { path, total: modules.size + quiet * 2 };
}
