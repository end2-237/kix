import type { MetadataRoute } from "next";

// MASTER BREAK est pensé comme une PWA mobile-first : installable, plein écran, thème nuit.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Master Break — l'écosystème de l'excellence billard",
    short_name: "Master Break",
    description:
      "Jetons de billard, boutique et billetterie de tournois au Cameroun. Paiement Mobile Money.",
    start_url: "/app",
    display: "standalone",
    background_color: "#071a13",
    theme_color: "#071a13",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
