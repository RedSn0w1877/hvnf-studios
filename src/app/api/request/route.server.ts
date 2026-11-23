import { NextResponse } from "next/server";
import { previewRequestSchema, type RequestDetails } from "@/lib/validations";
import { takeRateLimit } from "@/lib/rate-limit";
import { studioEmail, visitorEmail, type OutgoingEmail } from "@/lib/request-email";

/**
 * POST /api/request: the homepage "Ask for a preview" card sends here, and the
 * request is emailed to the studio through Resend. Nothing is stored.
 *
 * Only the server build has this route. next.config.ts leaves "server.ts" out of
 * pageExtensions in the static (GitHub Pages) build, so this file is not a route
 * there and the static export is unaffected.
 *
 * Reply shapes the card understands:
 *   200 { ok: true }                         the studio email was accepted
 *   400 { ok: false, errors: { field: msg }} a field failed (the card shows each under its field)
 *   429 { ok: false, error }                 too many from one address
 *   503 { ok: false, fallback: true }        no key, or Resend said no: the card falls back to mailto
 */

export const dynamic = "force-dynamic";

const MIN_FILL_MS = 3000;
const MAX_BODY = 20_000;
const RESEND_TIMEOUT_MS = 8000;

const json = (body: Record<string, unknown>, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

function clientIp(request: Request): string {
  // Vercel sets x-forwarded-for itself. Locally and behind other hosts it is whatever the caller sent,
  // which is fine for a best-effort limit.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function send(base: string, key: string, email: OutgoingEmail): Promise<boolean> {
  try {
    const res = await fetch(`${base}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const wait = takeRateLimit(ip);
  if (wait) {
    return json(
      { ok: false, error: "That’s a few requests in a short time. Please try again in a few minutes." },
      429,
      { "Retry-After": String(wait) },
    );
  }

  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY) return json({ ok: false, error: "That’s too much text to send in one go." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "We couldn’t read that request." }, 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ ok: false, error: "We couldn’t read that request." }, 400);
  }

  // The honeypot: a person never sees this field. Pretend it worked and send nothing.
  const trap = (body as Record<string, unknown>).nickname;
  if (typeof trap === "string" && trap.trim() !== "") return json({ ok: true }, 200);

  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      errors[field] ??= issue.message;
    }
    return json({ ok: false, error: "Some answers need another look.", errors }, 400);
  }

  const { nickname: _nickname, openedAt, ...details } = parsed.data;
  void _nickname;
  const elapsed = Date.now() - openedAt;
  if (elapsed < MIN_FILL_MS) {
    return json({ ok: false, error: "That was quick. Please check your answers and send it again." }, 400);
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[request] RESEND_API_KEY is not set");
    return json({ ok: false, fallback: true }, 503);
  }
  const base = (process.env.RESEND_API_BASE ?? "https://api.resend.com").replace(/\/+$/, "");

  const data = details as RequestDetails;
  if (!(await send(base, key, studioEmail(data)))) {
    console.error("[request] the studio email was not accepted");
    return json({ ok: false, fallback: true }, 503);
  }
  // The visitor's copy is a courtesy: the request has already reached the studio.
  if (!(await send(base, key, visitorEmail(data)))) console.error("[request] the visitor copy was not accepted");

  return json({ ok: true }, 200);
}
