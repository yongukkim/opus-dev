import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isConsoleDevPreview } from "@/lib/devPreview";
import { localeFromPath, pathAfterLocale, resolveLocale } from "@/lib/localeResolve";

const { auth } = NextAuth(authConfig);

/**
 * ISO 27001 A.9.2.1 / A.18.1.4 (CLAUDE.md §4, §7)
 * KO: `/[locale]/…` 접두를 강제하고, 등록은 `OPUS_CONSOLE_REGISTER_SECRET`과 일치하는 `invite`가 있을 때만 허용한다.
 * JA: `/[locale]/…` プレフィックスを強制し、登録は `invite` がサーバ秘密と一致する場合のみ許可する。
 * EN: Force `/[locale]/…` prefix; `/register` is allowed only when `invite` matches `OPUS_CONSOLE_REGISTER_SECRET`.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const devPreview = isConsoleDevPreview();

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
    if (devPreview) {
      return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/home`, req.url)));
    }
    if (!req.auth?.user?.id) {
      return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    }
    if (req.auth.user.role !== "operator") {
      return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    }
    return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/home`, req.url)));
  }

  if (rest.startsWith("/login")) {
    return withLocaleHeader(NextResponse.next());
  }

  if (rest.startsWith("/register")) {
    return withLocaleHeader(NextResponse.next());
  }

  if (rest.startsWith("/review")) {
    if (devPreview) {
      return withLocaleHeader(NextResponse.next());
    }
    if (!req.auth?.user?.id || req.auth.user.role !== "operator") {
      return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    }
    return withLocaleHeader(NextResponse.next());
  }

  if (rest.startsWith("/home")) {
    if (devPreview) {
      return withLocaleHeader(NextResponse.next());
    }
    if (!req.auth?.user?.id || req.auth.user.role !== "operator") {
      return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    }
    return withLocaleHeader(NextResponse.next());
  }

  if (rest.startsWith("/payments")) {
    if (devPreview) {
      return withLocaleHeader(NextResponse.next());
    }
    if (!req.auth?.user?.id || req.auth.user.role !== "operator") {
      return withLocaleHeader(NextResponse.redirect(new URL(`/${locale}/login`, req.url)));
    }
    return withLocaleHeader(NextResponse.next());
  }

  return withLocaleHeader(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
