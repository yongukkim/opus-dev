import Link from "next/link";
import { Suspense } from "react";
import type { Session } from "next-auth";
import type { Locale } from "@/i18n/config";
import type { ConsoleMessages } from "@/i18n/types";
import { ConsoleSidebarNav } from "@/components/ConsoleSidebarNav";
import { ConsoleLanguageSwitcher } from "@/components/ConsoleLanguageSwitcher";
import { getDictionary } from "@/i18n/catalog";
import { buildConsoleStatsNavItems } from "@/lib/consoleStatsNav";

export function ConsoleChrome({
  user,
  children,
  previewMode = false,
  locale,
  labels,
  langLabels,
}: {
  user: Session["user"];
  children: React.ReactNode;
  previewMode?: boolean;
  locale: Locale;
  labels: ConsoleMessages["chrome"];
  langLabels: ConsoleMessages["lang"];
}) {
  const signOutCallback = encodeURIComponent(`/${locale}/login`);
  const statsNav = buildConsoleStatsNavItems(locale, getDictionary(locale).dashboard);

  return (
    <div className="flex min-h-screen flex-col bg-[#0E0E0E] text-[#F6F4F0]">
      {previewMode ? (
        <div className="border-b border-amber-500/25 bg-amber-950/40 px-4 py-2 text-center text-sm text-amber-100">
          <strong>{labels.previewTitle}</strong> — {labels.previewBody}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-[#121212] md:flex">
          <div className="flex h-14 items-center border-b border-white/10 px-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#DEB892]">{labels.brand}</span>
          </div>
          <ConsoleSidebarNav locale={locale} labels={labels} statsNav={statsNav} />
          <div className="border-t border-white/10 p-4 text-xs text-[#F6F4F0]/50">
            <p className="truncate font-medium text-[#F6F4F0]/80">{user.email}</p>
            <div className="mt-2">
              <Suspense fallback={null}>
                <ConsoleLanguageSwitcher locale={locale} labels={langLabels} />
              </Suspense>
            </div>
            {previewMode ? (
              <p className="mt-2">{labels.notSignedIn}</p>
            ) : (
              <Link
                href={`/api/auth/signout?callbackUrl=${signOutCallback}`}
                className="mt-2 inline-block text-sm font-medium text-[#DEB892] hover:text-[#F6F4F0]"
              >
                {labels.signOut}
              </Link>
            )}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-14 flex-wrap items-center gap-2 border-b border-white/10 bg-[#121212] px-3 py-2 md:hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#DEB892]">{labels.brand}</span>
            <div className="flex w-full flex-wrap gap-1 text-xs">
              <Link
                href={`/${locale}/home`}
                className="rounded-md border border-white/10 px-2 py-1.5 text-[#F6F4F0]/85 hover:bg-white/5"
              >
                {labels.navHome}
              </Link>
              <Link
                href={`/${locale}/review`}
                className="rounded-md border border-white/10 px-2 py-1.5 text-[#F6F4F0]/85 hover:bg-white/5"
              >
                {labels.navReview}
              </Link>
              <Link
                href={`/${locale}/payments`}
                className="rounded-md border border-white/10 px-2 py-1.5 text-[#F6F4F0]/85 hover:bg-white/5"
              >
                {labels.navPayments}
              </Link>
            </div>
            {previewMode ? (
              <span className="text-[10px] text-[#F6F4F0]/45">{labels.mobilePreview}</span>
            ) : (
              <Link href={`/api/auth/signout?callbackUrl=${signOutCallback}`} className="ml-auto text-xs font-medium text-[#DEB892]">
                {labels.signOut}
              </Link>
            )}
          </header>
          <main className="min-h-0 flex-1 bg-[#0E0E0E]">{children}</main>
        </div>
      </div>
    </div>
  );
}
