import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Off for now: this app is dynamic/personalized end-to-end (auth, roles,
  // view counts); enabling this requires wrapping every data access in
  // Suspense boundaries, a Phase 2 performance pass, not an MVP blocker.
  cacheComponents: false,
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
