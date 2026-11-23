/**
 * A small per-IP limit for the request form: LIMIT sends per WINDOW_MS.
 *
 * Best effort only. The counts live in this server instance's memory, so on a
 * serverless host (Vercel) each warm instance keeps its own tally and a cold
 * start forgets it. That is enough to stop a script hammering the form from one
 * address; the honeypot, the minimum-time check and Resend's own limits do the rest.
 */
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, number[]>();

/** Returns 0 if this send is allowed (and counts it), else the seconds to wait. */
export function takeRateLimit(key: string, now = Date.now()): number {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return Math.max(1, Math.ceil((recent[0] + RATE_WINDOW_MS - now) / 1000));
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing without bound: drop keys that have gone quiet.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
  }
  return 0;
}
