import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 est un module natif : il reste côté serveur, non bundlé.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
