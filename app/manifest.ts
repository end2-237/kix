import type { MetadataRoute } from "next";

// KIX est pensé comme une PWA mobile-first : installable, plein écran, thème nuit.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KIX — billard, vape et nuit",
    short_name: "KIX",
    description:
      "Jetons de billard, vapes et billetterie de tournois au Cameroun. Paiement Orange Money et MTN MoMo.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
