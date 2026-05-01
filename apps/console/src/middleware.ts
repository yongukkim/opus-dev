import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isConsoleDevPreview } from "@/lib/devPreview";

const { auth } = NextAuth(authConfig);

/**
 * ISO 27001 A.9.2.1 — Console surface is operator-only for protected pages.
 * KO: /review 등 업무 경로는 JWT에서 operator 역할이 있을 때만 통과시킨다.
 * JA: /review など業務パスはJWTのoperatorロールがある場合のみ通過させる。
 * EN: Allow /review only when the JWT carries the operator role.
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

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (devPreview) {
      return NextResponse.redirect(new URL("/review", req.url));
    }
    if (!req.auth?.user?.id) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (req.auth.user.role !== "operator") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/review", req.url));
  }

  if (pathname.startsWith("/review")) {
    if (devPreview) {
      return NextResponse.next();
    }
    if (!req.auth?.user?.id || req.auth.user.role !== "operator") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
