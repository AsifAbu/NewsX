import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Off for now: this app is dynamic/personalized end-to-end (auth, roles,
  // view counts); enabling this requires wrapping every data access in
  // Suspense boundaries, a Phase 2 performance pass, not an MVP blocker.
  cacheComponents: false,
  // The local ONNX paraphrase models (~265MB each) are read from disk at
  // runtime via a dynamic path, not a static import, so Next.js won't trace
  // them into the serverless function bundle automatically. This makes sure
  // they're included on deploy. See docs/RULES.md for the Vercel size
  // implications (needs the "Large Functions" beta — standard 250MB limit
  // doesn't cover these).
  outputFileTracingIncludes: {
    "/post": ["./models/**"],
  },
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
