import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // One build dir per tenant: NEXT_PUBLIC_* is inlined at compile time, so two
  // tenants sharing .next would hydrate with the wrong client bundle.
  distDir: process.env.FREIGHTFLOW_DIST_DIR || ".next",
};

export default nextConfig;
