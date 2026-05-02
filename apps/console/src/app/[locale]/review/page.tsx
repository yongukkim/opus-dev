import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { isSupportedLocale } from "@/i18n/config";
import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleReviewWorkspace } from "@/components/ConsoleReviewWorkspace";
import { devPreviewChromeUser, isConsoleDevPreview } from "@/lib/devPreview";
import { devPreviewDemoRows } from "@/lib/devPreviewDemoRows";
import { normalizeSubmissionList } from "@/lib/submissionRow";
import { fetchSubmissionsForOperator } from "@/lib/webInternal";

export default async function ReviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isSupportedLocale(raw)) notFound();
  const locale = raw;

  const preview = isConsoleDevPreview();
  const session = preview ? null : await auth();
  const t = getDictionary(locale);

  if (!preview && (!session?.user?.id || session.user.role !== "operator")) {
    redirect(`/${locale}/login`);
  }

  const chromeUser = preview ? devPreviewChromeUser() : session!.user;

  let rows: ReturnType<typeof normalizeSubmissionList> = [];
  let loadError: string | null = null;

  if (preview) {
    rows = devPreviewDemoRows();
  } else {
    try {
      const rawList = await fetchSubmissionsForOperator(session!.user.id);
      rows = normalizeSubmissionList(rawList);
    } catch {
      loadError = t.review.loadError;
    }
  }

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview} locale={locale} labels={t.chrome}>
      <div className="border-b border-white/10 px-6 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F6F4F0]">{t.review.title}</h1>
        <p className="mt-1 text-sm text-[#F6F4F0]/60">{t.review.subtitle}</p>
        {loadError ? (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">{loadError}</div>
        ) : (
          <ConsoleReviewWorkspace initialRows={rows} readOnlyPreview={preview} />
        )}
      </div>
    </ConsoleChrome>
  );
}
