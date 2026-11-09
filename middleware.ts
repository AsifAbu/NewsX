import { NextRequest, NextResponse } from "next/server";

// Static CSP (script-src 'self', no nonce) silently breaks the app: Next.js's
// App Router streams Suspense/loading.tsx content and hydrates client
// components via inline <script> tags, which a nonce-less CSP blocks outright
// (confirmed via a live CSP violation + Next's own self.__next_r runtime
// error). Per-request nonce in middleware is the documented fix — Next scans
// the Content-Security-Policy response header for a `nonce-<value>` token and
// stamps that same nonce onto every script tag it injects.
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // React's dev-mode debugging tools (stack-trace reconstruction) call
  // eval() — never used in production builds, per React's own warning — so
  // 'unsafe-eval' is scoped to development only, not shipped to prod.
  const scriptSrc = process.env.NODE_ENV === "development"
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    // Pulled articles/avatars can point at any https image host (not just
    // Cloudinary), so img-src stays broad rather than allow-listing one host.
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization requests — they don't render
    // scripts and don't need a CSP recomputed per request.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
