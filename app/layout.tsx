import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SnackbarProvider } from "@/components/ui/Snackbar";
import "./globals.css";

const geist = localFont({
  src: [
    { path: "./fonts/Geist-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Geist-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Geist-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Geist-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Geist-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Master Break — l'écosystème de l'excellence billard",
    template: "%s · Master Break",
  },
  description:
    "Achète tes jetons de billard depuis ton téléphone, scanne ton QR à la table, commande ton matériel et prends tes billets de tournoi. Douala et Yaoundé.",
  applicationName: "Master Break",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applique le thème avant le premier rendu : pas de flash blanc au chargement.
const themeScript = `try{var t=localStorage.getItem("mb.theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-ink antialiased">
        <SnackbarProvider>{children}</SnackbarProvider>
      </body>
    </html>
  );
}
