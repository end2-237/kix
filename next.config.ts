import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le driver libsql embarque des binaires natifs : il reste hors du bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
