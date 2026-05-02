import Link from "next/link";
import type { Session } from "next-auth";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";

export function ConsoleChrome({
  user,
  children,
  previewMode = false,
  locale,
  labels,
}: {
  user: Session["user"];
  children: React.ReactNode;
  /** Local dev: bypass sign-in; no real session. */
  previewMode?: boolean;
  locale: Locale;
  labels: ConsoleMessages["chrome"];
}) {
  const signOutCallback = encodeURIComponent(`/${locale}/login`);

  return (
    <div className="flex min-h-screen flex-col">
      {previewMode ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          <strong>{labels.previewTitle}</strong> — {labels.previewBody}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 md:flex">
          <div className="flex h-14 items-center border-b border-gray-200 px-4">
            <span className="text-sm font-semibold text-gray-900">OPUS Console</span>
          </div>
          <nav className="flex-1 p-3 text-sm">
            <Link
              href={`/${locale}/review`}
              className="block rounded-md bg-white px-3 py-2 font-medium text-gray-900 shadow-sm ring-1 ring-gray-200"
            >
              {labels.submissions}
            </Link>
          </nav>
          <div className="border-t border-gray-200 p-4 text-xs text-gray-500">
            <p className="truncate font-medium text-gray-700">{user.email}</p>
            {previewMode ? (
              <p className="mt-2 text-gray-500">{labels.notSignedIn}</p>
            ) : (
              <Link
                href={`/api/auth/signout?callbackUrl=${signOutCallback}`}
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                {labels.signOut}
              </Link>
            )}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
            <span className="text-sm font-semibold">OPUS Console</span>
            {previewMode ? (
              <span className="text-xs text-gray-500">{labels.mobilePreview}</span>
            ) : (
              <Link href={`/api/auth/signout?callbackUrl=${signOutCallback}`} className="text-xs text-blue-600">
                {labels.signOut}
              </Link>
            )}
          </header>
          <main className="flex-1 bg-white">{children}</main>
        </div>
      </div>
    </div>
  );
}
