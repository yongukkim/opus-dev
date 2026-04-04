import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

function localeFromPath(pathname: string): Locale | null {
  const seg = pathname.split("/")[1];
  if (seg && (locales as readonly string[]).includes(seg)) {
    return seg as Locale;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  /** Legacy /seller/* → default locale so bookmarks and shared links resolve. */
  if (pathname.startsWith("/seller")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const found = localeFromPath(pathname);
  if (found) {
    const res = NextResponse.next();
    res.headers.set("x-opus-locale", found);
    /** Dev layout preview: query can be missing from some RSC fetches; mirror ?preview=1 into a request header. */
    if (
      process.env.NODE_ENV !== "production" &&
      pathname.includes("/vault/transfer/register")
    ) {
      const preview = request.nextUrl.searchParams.get("preview");
      if (preview === "1" || preview === "true") {
        res.headers.set("x-opus-transfer-register-preview", "1");
      }
    }
    return res;
  }

  const url = request.nextUrl.clone();
  const suffix = pathname === "/" ? "" : pathname;
  url.pathname = `/${defaultLocale}${suffix}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
