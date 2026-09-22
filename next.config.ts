import type { NextConfig } from "next";

/**
 * L'hôte de stockage, déclaré au moment de la construction.
 *
 * `next/image` refuse un domaine distant qu'on ne lui a pas annoncé — sans
 * cette entrée, une image téléversée sur Supabase ne s'afficherait nulle part.
 * La variable doit donc exister *à la construction*, pas seulement à
 * l'exécution.
 */
function hoteStockage(): { protocol: "http" | "https"; hostname: string; port?: string } | null {
  const brut = process.env.SUPABASE_URL?.trim();
  if (!brut) return null;
  try {
    const u = new URL(brut);
    // Le protocole suit l'URL : figé sur https, un Supabase servi en clair
    // derrière un proxy ne correspondrait à aucun motif, et ses images
    // seraient refusées sans que rien ne le dise.
    return {
      protocol: u.protocol === "http:" ? "http" : "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
    };
  } catch {
    console.warn(`[mb] SUPABASE_URL « ${brut} » n'est pas une URL : les images téléversées ne s'afficheront pas.`);
    return null;
  }
}

const hote = hoteStockage();

const nextConfig: NextConfig = {
  // Le driver libsql embarque des binaires natifs : il reste hors du bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],

  images: {
    remotePatterns: hote ? [{ ...hote, pathname: "/storage/v1/object/public/**" }] : [],
  },
};

export default nextConfig;
