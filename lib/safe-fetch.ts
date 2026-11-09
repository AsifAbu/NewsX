import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);
const MAX_REDIRECTS = 5;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
  if (/^fe[89ab]/.test(lower)) return true; // fe80::/10
  if (lower.startsWith("::ffff:")) return isPrivateIPv4(lower.slice(7));
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unrecognized format — fail closed
}

// Blocks SSRF: rejects non-http(s) schemes, localhost/metadata hostnames, and
// any hostname that resolves to a private/loopback/link-local address.
async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("That URL can't be used.");
  }
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("That URL can't be used.");
  }
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("That URL can't be used.");
    return url;
  }
  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0 || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("That URL can't be used.");
  }
  return url;
}

// Fetches a page's HTML, re-validating the target (including every redirect
// hop, manually followed) against the SSRF checks above, and capping the
// response size so a huge/streaming response can't exhaust memory.
export async function safeFetchHtml(initialUrl: string, init?: RequestInit): Promise<string> {
  let currentUrl = await assertPublicHttpUrl(initialUrl);

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(currentUrl.toString(), { ...init, redirect: "manual" });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect with no destination.");
      currentUrl = await assertPublicHttpUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      throw new Error("That page is too large to pull.");
    }

    if (!res.body) return await res.text();

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        await reader.cancel();
        throw new Error("That page is too large to pull.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf-8");
  }

  throw new Error("Too many redirects.");
}
