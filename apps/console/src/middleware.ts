import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isConsoleDevPreview } from "@/lib/devPreview";
import { localeFromPath, pathAfterLocale, resolveLocale } from "@/lib/localeResolve";

/**
 * ISO 27001 A.9.2.1 / A.18.1.4 (CLAUDE.md §4, §7)
 * KO: Auth.js auth() 래퍼 대신 getToken()으로 JWT를 직접 검증해 리다이렉트 루프를 방지한다.
 * JA: Auth.js auth() ラッパーの代わりに getToken() で JWT を直接検証し、リダイレクトループを防ぐ。
 * EN: Use getToken() directly instead of auth() wrapper to avoid redirect loops in Edge middleware.
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const devPreview = isConsoleDevPreview();

  // Auth.js v5 (next-auth@5.x) uses "__Secure-authjs.session-token" in production (HTTPS)
  // and "authjs.session-token" in development (HTTP).
  const secret = process.env["AUTH_SECRET"] ?? "";
  const token = await getToken({ req, secret })
    ?? await getToken({ req, secret, cookieName: "__Secure-authjs.session-token" })
    ?? await getToken({ req, secret, cookieName: "authjs.session-token" })
    ?? await getToken({ req, secret, cookieName: "__Secure-next-auth.session-token" })
    ?? await getToken({ req, secret, cookieName: "next-auth.session-token" });
  const isOperator = token?.["role"] === "operator";

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
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

  const locale = found;
  const rest = pathAfterLocale(pathname, locale);

  const withLocaleHeader = (res: NextResponse) => {
    res.headers.set("x-opus-console-locale", locale);
    res.headers.set("Vary", "Cookie");
    return res;
  };

  // Register is open (email verification required after sign-up; OPERATOR role granted manually).
  if (rest === "/register" || rest.startsWith("/register/")) {
    return withLocaleHeader(NextResponse.next());
  }

  if (rest === "/" || rest === "") {
    if (devPreview) return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/home`, req.url)));
    if (!token) return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    if (!isOperator) return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/home`, req.url)));
  }

  if (rest.startsWith("/login") || rest.startsWith("/register")) {
    return withLocaleHeader(NextResponse.next());
  }

  if (rest.startsWith("/review") || rest.startsWith("/home") || rest.startsWith("/payments")) {
    if (devPreview) return withLocaleHeader(NextResponse.next());
    if (!token || !isOperator) {
      return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    }
    return withLocaleHeader(NextResponse.next());
  }

  return withLocaleHeader(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
