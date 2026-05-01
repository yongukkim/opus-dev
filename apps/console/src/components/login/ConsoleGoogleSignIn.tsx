"use client";

/**
 * ISO 27001 A.9.4.2 (CLAUDE.md §2) — OAuth entry point is server-handled; this link only starts the provider flow.
 * KO: Google 로그인 시작은 /api/auth/signin/google 로만 연결하고 비밀은 클라이언트에 두지 않는다.
 * JA: Googleログイン開始は /api/auth/signin/google のみに接続し、秘密をクライアントに置かない。
 * EN: Google sign-in starts only via `/api/auth/signin/google`; no secrets on the client.
 */
export function ConsoleGoogleSignIn({ configured }: { configured: boolean }) {
  if (!configured) {
    return (
      <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Google sign-in is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET on the server (same variables as
        the public OPUS web app).
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      <p className="text-sm text-gray-600">
        Use the same Google sign-in flow as the public OPUS site. If you are new, complete signup on the public site
        first (Terms, Privacy, and related consents), then return here.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth requires full navigation for the provider redirect */}
      <a
        href="/api/auth/signin/google"
        className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
      >
        Continue with Google
      </a>
    </div>
  );
}
