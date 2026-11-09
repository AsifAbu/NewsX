import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// In-memory, per-instance only — on Vercel's serverless runtime this doesn't
// guarantee a hard global limit (each invocation can land on a different
// instance), but it still stops simple scripted bursts within a warm
// instance, which is the main gap today (no rate limiting at all).
const buckets = new Map<string, Bucket>();

async function resolveIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

// Returns true if the call is allowed, false if the limit has been hit.
export async function checkRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const ip = await resolveIp();
  const key = `${scope}:${identifier}:${ip}`;
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
