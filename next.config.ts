import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Off for now: this app is dynamic/personalized end-to-end (auth, roles,
  // view counts); enabling this requires wrapping every data access in
  // Suspense boundaries, a Phase 2 performance pass, not an MVP blocker.
  cacheComponents: false,
  experimental: {
    // Next.js Server Actions silently cap request bodies at 1MB by default —
    // separate from, and smaller than, the 10MB check in lib/cloudinary.ts.
    // A real photo (e.g. a phone camera avatar upload) routinely exceeds 1MB,
    // so it was failing at the framework level (HTTP 413) before our own
    // validation ever ran. Raised to match our own limit.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // @huggingface/transformers loads its Node backend via a dynamic
  // require("onnxruntime-node"), which Next.js's dependency tracer can't
  // follow statically — on Vercel this left the native onnxruntime-node
  // binary out of the deployed function entirely ("Cannot find module
  // 'onnxruntime-node'"). Marking both as external makes Next.js skip
  // tracing/bundling them and include their real node_modules contents
  // (native binaries included) instead.
  serverExternalPackages: ["onnxruntime-node", "onnxruntime-common", "@huggingface/transformers"],
  // jsdom's own dependency chain (used for scraping article URLs) keeps
  // introducing ESM-only sub-dependencies (first @exodus/bytes, then
  // @csstools/css-calc via @asamuzakjp/css-color) that crash with
  // ERR_REQUIRE_ESM when jsdom is left as a raw runtime external — Node
  // can't require() an ES Module synchronously, no matter what. Bundling
  // jsdom through Next's own compiler instead lets its interop layer
  // resolve ESM/CJS mismatches at build time, fixing this whole class of
  // failure instead of chasing each new ESM-only leaf one at a time.
  transpilePackages: ["jsdom"],
  // The local ONNX paraphrase models (~265MB each) are read from disk at
  // runtime via a dynamic path, not a static import, so Next.js won't trace
  // them into the serverless function bundle automatically. This makes sure
  // they're included on deploy. See docs/RULES.md for the Vercel size
  // implications (needs the "Large Functions" beta — standard 250MB limit
  // doesn't cover these).
  //
  // onnxruntime-node's native binary is loaded via OS-level dlopen, not a
  // JS require Next.js can see — serverExternalPackages alone isn't enough,
  // the actual .node/.so files have to be force-included too. Scoped to the
  // JS loader + Linux binaries only (Vercel functions run on Linux), not the
  // whole package, to skip ~220MB of unused Windows/macOS binaries.
  outputFileTracingIncludes: {
    // onnxruntime-node's native binary is selected at runtime via a dynamic
    // platform/arch path and loaded through OS-level dlopen — invisible to
    // any static tracer. Named dynamic-segment keys with literal brackets
    // (e.g. "/news/[slug]") don't reliably pick up node_modules-rooted
    // includes (confirmed empirically via the generated .nft.json trace
    // manifests); a bracket-free glob segment ("/news/*") does. A "/*"
    // catch-all also works but bloats every route, which broke Vercel's
    // function-pooling and hit the Hobby plan's 12-function cap — scoping
    // to just the two routes that need it avoids that.
    "/post": [
      "./models/**", // Rephrase
      "./node_modules/onnxruntime-node/package.json",
      "./node_modules/onnxruntime-node/dist/**",
      "./node_modules/onnxruntime-node/lib/**",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/**",
      "./node_modules/onnxruntime-common/**",
    ],
    "/news/[slug]": ["./models/**"], // Summarize
    "/news/*": [
      "./node_modules/onnxruntime-node/package.json",
      "./node_modules/onnxruntime-node/dist/**",
      "./node_modules/onnxruntime-node/lib/**",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/**",
      "./node_modules/onnxruntime-common/**",
    ],
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
