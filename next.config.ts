import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Off for now: this app is dynamic/personalized end-to-end (auth, roles,
  // view counts); enabling this requires wrapping every data access in
  // Suspense boundaries, a Phase 2 performance pass, not an MVP blocker.
  cacheComponents: false,
  // @huggingface/transformers loads its Node backend via a dynamic
  // require("onnxruntime-node"), which Next.js's dependency tracer can't
  // follow statically — on Vercel this left the native onnxruntime-node
  // binary out of the deployed function entirely ("Cannot find module
  // 'onnxruntime-node'"). Marking both as external makes Next.js skip
  // tracing/bundling them and include their real node_modules contents
  // (native binaries included) instead.
  serverExternalPackages: ["onnxruntime-node", "@huggingface/transformers"],
  // The local ONNX paraphrase models (~265MB each) are read from disk at
  // runtime via a dynamic path, not a static import, so Next.js won't trace
  // them into the serverless function bundle automatically. This makes sure
  // they're included on deploy. See docs/RULES.md for the Vercel size
  // implications (needs the "Large Functions" beta — standard 250MB limit
  // doesn't cover these).
  outputFileTracingIncludes: {
    "/post": ["./models/**"], // Rephrase
    "/news/[slug]": ["./models/**"], // Summarize
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
