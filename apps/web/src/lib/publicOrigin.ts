import type { NextRequest } from "next/server";

/**
 * Build absolute public origin for Stripe redirect URLs.
 * Prefer OPUS_PUBLIC_APP_URL in production when reverse proxies strip Host.
 */
export function publicOriginFromRequest(request: NextRequest): string {
  const fixed = process.env["OPUS_PUBLIC_APP_URL"]?.trim().replace(/\/$/, "");
  if (fixed) return fixed;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
