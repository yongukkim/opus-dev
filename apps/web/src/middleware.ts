import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import {
  fallbackLocale,
  localeCookieName,
  locales,
  type Locale,
} from "@/i18n/config";
import { isLikelyMobileWebClient } from "@/lib/mobileUserAgent";

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (§2, §6) Edge-safe NextAuth instance.
 * KO: 미들웨어는 DB·node:crypto 의존을 피하기 위해 공유 설정만 로드한다.
 * JA: ミドルウェアはDB・node:crypto依存を避けるため共有設定のみ読み込む。
 * EN: Middleware loads only the shared Edge-safe config (no DB / node:crypto).
 */
const { auth } = NextAuth(authConfig);

function localeFromPath(pathname: string): Locale | null {
  const seg = pathname.split("/")[1];
  if (seg && (locales as readonly string[]).includes(seg)) {
    return seg as Locale;
  }
  return null;
}

function pathAfterLocale(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}

/** Vault + seller + mobile immersive viewer require a signed-in user (Edge JWT only). */
function needsAuthentication(pathAfterLocale: string): boolean {
  if (pathAfterLocale === "/vault" || pathAfterLocale.startsWith("/vault/")) return true;
  if (pathAfterLocale === "/seller" || pathAfterLocale.startsWith("/seller/")) return true;
  if (pathAfterLocale.startsWith("/viewer/immersive/")) return true;
  return false;
}

/**
 * ISO 27001 A.18.1.4 (§7 Privacy by Design)
 * KO: `Accept-Language`는 브라우저가 모든 HTTP 요청에 자동 포함하는 표준 헤더이며,
 *     APPI·PIPA 상 별도 수집·고지 대상이 아니다. IP 기반 GeoIP는 도입하지 않는다.
 * JA: `Accept-Language` は標準ヘッダであり、APPI・PIPA上の個別収集・告知対象に
 *     あたらない。IPベースのジオロケーションは本実装では導入しない。
 * EN: `Accept-Language` is a standard HTTP header browsers attach automatically;
 *     no extra APPI/PIPA notification is triggered. No IP GeoIP is used here.
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [rawLang, ...params] = part.trim().split(";");
      let q = 1;
      for (const param of params) {
        const [key, value] = param.split("=");
        if (key?.trim() === "q" && value) {
          const parsed = Number.parseFloat(value);
          if (!Number.isNaN(parsed)) q = parsed;
        }
      }
      return { lang: rawLang?.trim().toLowerCase() ?? "", q };
    })
    .filter(({ lang }) => lang.length > 0)
    .sort((a, b) => b.q - a.q)
    .map(({ lang }) => lang);
}

function matchLocaleFromLanguages(languages: string[]): Locale | null {
  for (const lang of languages) {
    const primary = lang.split("-")[0];
    if (primary && (locales as readonly string[]).includes(primary)) {
      return primary as Locale;
    }
  }
  return null;
}

type LocaleSource = "cookie" | "header" | "fallback";

function resolveLocale(req: NextRequest): { locale: Locale; source: LocaleSource } {
  const cookieValue = req.cookies.get(localeCookieName)?.value;
  if (cookieValue && (locales as readonly string[]).includes(cookieValue)) {
    return { locale: cookieValue as Locale, source: "cookie" };
  }
  const header = req.headers.get("accept-language");
  if (header) {
    const matched = matchLocaleFromLanguages(parseAcceptLanguage(header));
    if (matched) return { locale: matched, source: "header" };
  }
  return { locale: fallbackLocale, source: "fallback" };
}

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (§2, §6)
 * KO: ① 경로에 로케일 prefix 없음 → 쿠키→Accept-Language→fallback 순 자동 해석 후 리다이렉트.
 *     ② 보호 구역(/vault, /seller)은 JWT 세션으로 통제한다(Edge에서 DB 없음).
 * JA: ①ロケール前置詞が無い場合は Cookie→Accept-Language→fallback の順で自動解決、
 *     ②保護領域はJWTセッションで制御する（EdgeでDB無し）。
 * EN: (1) No locale prefix → resolve via Cookie→Accept-Language→fallback, then redirect.
 *     (2) Protected prefixes are gated by JWT session (Edge-safe, no DB).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/seller")) {
    const { locale, source } = resolveLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    const res = NextResponse.redirect(url);
    res.headers.set("Vary", "Accept-Language, Cookie");
    res.headers.set("x-opus-locale-source", source);
    return res;
  }

  const found = localeFromPath(pathname);
  if (!found) {
    const { locale, source } = resolveLocale(req);
    const url = req.nextUrl.clone();
    const suffix = pathname === "/" ? "" : pathname;
    url.pathname = `/${locale}${suffix}`;
    const res = NextResponse.redirect(url);
    res.headers.set("Vary", "Accept-Language, Cookie");
    res.headers.set("x-opus-locale-source", source);
    return res;
  }

  const rest = pathAfterLocale(pathname, found);

  if (rest.startsWith("/viewer/immersive/")) {
    const mobile = isLikelyMobileWebClient(req.headers.get("user-agent"), req.headers.get("sec-ch-ua-mobile"));
    if (!mobile) {
      const bridge = new URL(`/${found}/mobile-bridge`, req.url);
      bridge.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(bridge);
    }
  }

  if (needsAuthentication(rest) && !req.auth) {
    const loginUrl = new URL(`/${found}/login`, req.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  res.headers.set("x-opus-locale", found);
  res.headers.set("Vary", "Cookie");
  if (
    process.env.NODE_ENV !== "production" &&
    pathname.includes("/vault/transfer/register")
  ) {
    const preview = req.nextUrl.searchParams.get("preview");
    if (preview === "1" || preview === "true") {
      res.headers.set("x-opus-transfer-register-preview", "1");
    }
  }
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
