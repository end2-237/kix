import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const spaceGrotesk = localFont({
  src: [{ path: "./fonts/SpaceGrotesk-700.woff2", weight: "700", style: "normal" }],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = localFont({
  src: [
    { path: "./fonts/Outfit-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Outfit-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Outfit-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KIX — billard, vape et nuit",
    template: "%s · KIX",
  },
  description:
    "Achète tes jetons de billard depuis ton téléphone, scanne ton QR à la table, commande tes vapes et prends tes billets de tournoi. Douala et Yaoundé.",
  applicationName: "KIX",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${outfit.variable}`}>
      <body className="bg-night text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
