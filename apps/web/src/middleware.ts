import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

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

/** Vault + seller flows require a signed-in user. Operator review stays demo-gated separately. */
function needsAuthentication(pathAfterLocale: string): boolean {
  if (pathAfterLocale === "/vault" || pathAfterLocale.startsWith("/vault/")) return true;
  if (pathAfterLocale === "/seller" || pathAfterLocale.startsWith("/seller/")) return true;
  return false;
}

/**
 * ISO 27001 A.9.4.2 / A.13.1.3 (§2, §6)
 * KO: 로케일 라우팅 후 JWT 세션으로 보호 구역(/vault, /seller)을 통제한다(Edge에서 DB 없음).
 * JA: ロケール後にJWTセッションで保護領域を制御する（EdgeでDBなし）。
 * EN: After locale routing, enforce protected prefixes via JWT session (Edge-safe, no DB).
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
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const found = localeFromPath(pathname);
  if (!found) {
    const url = req.nextUrl.clone();
    const suffix = pathname === "/" ? "" : pathname;
    url.pathname = `/${defaultLocale}${suffix}`;
    return NextResponse.redirect(url);
  }

  const rest = pathAfterLocale(pathname, found);
  if (needsAuthentication(rest) && !req.auth) {
    const loginUrl = new URL(`/${found}/login`, req.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  res.headers.set("x-opus-locale", found);
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
