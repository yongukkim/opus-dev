import { NextResponse } from "next/server";
import { locales } from "@/i18n/config";
import { OPUS_PRIVACY_VERSION, OPUS_TERMS_VERSION } from "@/lib/legalVersions";
import {
  OPUS_OAUTH_CONSENT_COOKIE,
  signOAuthConsentPayload,
  type OAuthConsentFlow,
} from "@/lib/oauthConsentCookie";

/**
 * ISO 27001 A.14.2.1 (§1) / A.18.1.4 (§7)
 * KO: 필수 동의가 모두 true일 때만 짧은 TTL의 서명 동의 쿠키를 발급한다.
 * JA: 必須同意がすべてtrueのときだけ短いTTLの署名付き同意クッキーを発行する。
 * EN: Issue a short-lived signed consent cookie only when all mandatory consents are true.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      flow?: OAuthConsentFlow;
      locale?: string;
      termsAccepted?: boolean;
      privacyAccepted?: boolean;
      overseasAccepted?: boolean;
      adultAccepted?: boolean;
      marketingAccepted?: boolean;
    };

    const flow =
      body.flow === "login" || body.flow === "signup" || body.flow === "artist-signup"
        ? body.flow
        : null;
    if (!flow) {
      return NextResponse.json({ ok: false, error: "invalid_flow" }, { status: 400 });
    }

    const locale =
      body.locale && (locales as readonly string[]).includes(body.locale) ? body.locale : "ko";

    if (
      !body.termsAccepted ||
      !body.privacyAccepted ||
      !body.overseasAccepted ||
      !body.adultAccepted
    ) {
      return NextResponse.json({ ok: false, error: "consent_incomplete" }, { status: 400 });
    }

    const payload = {
      v: 1 as const,
      flow,
      locale,
      recordedAt: new Date().toISOString(),
      tosVersion: OPUS_TERMS_VERSION,
      privacyVersion: OPUS_PRIVACY_VERSION,
      marketing: body.marketingAccepted === true,
    };

    const token = signOAuthConsentPayload(payload);
    const res = NextResponse.json({ ok: true });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set(OPUS_OAUTH_CONSENT_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });
    return res;
  } catch (error) {
    console.error("[oauth-precheck]", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 503 });
  }
}
