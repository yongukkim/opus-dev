import { NextRequest, NextResponse } from "next/server";
import { issueMobileAuthFromGoogleIdToken } from "@/lib/mobileGoogleIdTokenAuth";

export const runtime = "nodejs";

/**
 * ISO 27001 A.9.4.2 / A.10.1.1 / A.14.2.1 (CLAUDE.md §2, §3, §1)
 * KO: 브라우저(Expo web)는 client_secret을 보유할 수 없으므로, 서버에서 authorization code를 id_token으로 교환한 뒤 모바일 토큰을 발급한다.
 * JA: ブラウザ（Expo web）は client_secret を保持できないため、サーバで authorization code を id_token に交換後、モバイルトークンを発行する。
 * EN: Expo web cannot hold client_secret; server exchanges auth code for id_token, then issues mobile tokens.
 */

/** Expo Metro often prints LAN URLs (e.g. 172.x); browser Origin must be allowed for CORS. */
function isPrivateIpv4Host(hostname: string): boolean {
  const p = hostname.split(".").map((x) => Number.parseInt(x, 10));
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const a = p[0];
  const b = p[1];
  if (a === undefined || b === undefined) return false;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/** http(s) dev origins: localhost + RFC1918 (LAN Expo web only; ISO A.13.1.3 scope limited to this route). */
function isAllowedMobileDevBrowserUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname;
    if (h === "localhost" || h === "127.0.0.1") return true;
    return isPrivateIpv4Host(h);
  } catch {
    return false;
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!origin || !isAllowedMobileDevBrowserUrl(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: NextRequest): Promise<Response> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(req),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  const extra = corsHeaders(req);
  const clientId = process.env["AUTH_GOOGLE_ID"]?.trim();
  const clientSecret = process.env["AUTH_GOOGLE_SECRET"]?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: "server_google_not_configured" },
      { status: 503, headers: { "X-Robots-Tag": "noindex", ...extra } },
    );
  }

  let body: { code?: string; redirectUri?: string; codeVerifier?: string } | null = null;
  try {
    body = (await req.json()) as { code?: string; redirectUri?: string; codeVerifier?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400, headers: { "X-Robots-Tag": "noindex", ...extra } });
  }

  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const redirectUri = typeof body?.redirectUri === "string" ? body.redirectUri.trim() : "";
  const codeVerifier = typeof body?.codeVerifier === "string" ? body.codeVerifier.trim() : "";

  if (!code || code.length < 10 || code.length > 2048) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400, headers: { "X-Robots-Tag": "noindex", ...extra } });
  }
  if (!redirectUri || !isAllowedMobileDevBrowserUrl(redirectUri)) {
    return NextResponse.json({ ok: false, error: "invalid_redirect_uri" }, { status: 400, headers: { "X-Robots-Tag": "noindex", ...extra } });
  }
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    return NextResponse.json({ ok: false, error: "invalid_code_verifier" }, { status: 400, headers: { "X-Robots-Tag": "noindex", ...extra } });
  }

  let idToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }).toString(),
    });

    const raw = (await tokenRes.json().catch(() => ({}))) as {
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !raw.id_token) {
      const err = raw.error ?? "google_token_exchange_failed";
      return NextResponse.json({ ok: false, error: err }, { status: 400, headers: { "X-Robots-Tag": "noindex", ...extra } });
    }
    idToken = raw.id_token;
  } catch {
    return NextResponse.json({ ok: false, error: "google_network_error" }, { status: 502, headers: { "X-Robots-Tag": "noindex", ...extra } });
  }

  const auth = await issueMobileAuthFromGoogleIdToken(idToken);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status, headers: { "X-Robots-Tag": "noindex", ...extra } });
  }

  return NextResponse.json(
    {
      ok: true,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresIn: auth.expiresIn,
      user: auth.user,
    },
    { status: 200, headers: { "X-Robots-Tag": "noindex", ...extra } },
  );
}
