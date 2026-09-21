import { EcranClient } from "@/components/ecran/EcranClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Écran de salle",
  // Un téléviseur n'a rien à faire dans un index de moteur de recherche.
  robots: { index: false, follow: false },
};

/**
 * La page qu'on ouvre sur le téléviseur d'une salle.
 *
 * Elle ne demande aucune authentification : un écran n'a pas de compte. Au
 * premier chargement il s'annonce, affiche un QR, et attend d'être adopté par
 * le gérant. Ensuite il ne fait plus qu'obéir.
 */
export default function EcranPage() {
  return <EcranClient />;
}
