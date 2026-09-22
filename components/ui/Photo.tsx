import Image, { type ImageProps } from "next/image";

/**
 * Une image dont l'adresse vient de la base.
 *
 * `next/image` refuse tout hôte distant qu'on ne lui a pas déclaré : une
 * adresse collée à la main dans une fiche — ce que le champ image autorise
 * explicitement — faisait donc planter la page entière où elle s'affichait.
 *
 * Déclarer tous les hôtes n'est pas une option : l'optimiseur deviendrait un
 * relais d'images ouvert à n'importe qui, puisque `/_next/image?url=…` est
 * public. On sert donc l'adresse étrangère telle quelle. Nos propres images,
 * elles, restent optimisées — un forfait mobile à Douala ne se dépense pas en
 * photos de salle pleine taille.
 */
const PREFIXE = process.env.NEXT_PUBLIC_MB_STORAGE_PREFIX;

export function servirTelleQuelle(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;
  if (!/^https?:\/\//i.test(src)) return false; // un chemin local est déjà chez nous
  // Le préfixe entier, port compris : deux services sur la même machine ne
  // diffèrent souvent que par là.
  return !PREFIXE || !src.startsWith(PREFIXE);
}

export function Photo({ src, alt, unoptimized, ...reste }: ImageProps) {
  return <Image {...reste} src={src} alt={alt} unoptimized={unoptimized ?? servirTelleQuelle(src)} />;
}
