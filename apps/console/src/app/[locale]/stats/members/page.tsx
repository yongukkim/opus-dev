import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleMembersTable } from "@/components/ConsoleMembersTable";
import { getDictionary } from "@/i18n/catalog";
import { isSupportedLocale } from "@/i18n/config";
import { devPreviewChromeUser, isConsoleDevPreview } from "@/lib/devPreview";
import { devPreviewMemberRows } from "@/lib/devPreviewMembers";
import { fetchMembersForOperator } from "@/lib/webInternal";

export default async function ConsoleMembersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isSupportedLocale(raw)) notFound();
  const locale = raw;

  const preview = isConsoleDevPreview();
  const session = preview ? null : await auth();
  const t = getDictionary(locale);
  const m = t.members;

  if (!preview && (!session?.user?.id || session.user.role !== "operator")) {
    redirect(`/${locale}/login`);
  }

  const chromeUser = preview ? devPreviewChromeUser() : session!.user;

  let rows = devPreviewMemberRows();
  let total = rows.length;
  let loadError: string | null = null;

  if (!preview) {
    try {
      const data = await fetchMembersForOperator(session!.user.id);
      rows = data.users;
      total = data.total;
    } catch {
      loadError = m.loadError;
      rows = [];
      total = 0;
    }
  }

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview} locale={locale} labels={t.chrome} langLabels={t.lang}>
      <div className="min-h-full bg-white text-neutral-900">
        <div className="border-b border-neutral-200 px-6 py-6">
          <Link
            href={`/${locale}/home`}
            className="text-sm font-medium text-neutral-500 transition hover:text-neutral-800"
          >
            ← {m.backToDashboard}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">{m.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600">{m.subtitle}</p>
          {!loadError ? (
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
              {m.totalTpl.replace("{count}", String(total))}
            </p>
          ) : null}
        </div>

        <div className="px-6 py-8">
          {loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
          ) : (
            <ConsoleMembersTable rows={rows} labels={m} locale={locale} />
          )}
        </div>
      </div>
    </ConsoleChrome>
  );
}
