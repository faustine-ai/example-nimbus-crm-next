import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: routes are prerendered into a static shell and anything
  // that reads the request or the database streams in behind <Suspense>.
  cacheComponents: true,
  partialPrefetching: true,
  agentRules: false,
  // better-sqlite3 is a native module: keep it out of the server bundle.
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
