import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { DashboardMetricCard } from "@/components/DashboardMetricCard";
import { getDictionary } from "@/i18n/catalog";
import { isSupportedLocale } from "@/i18n/config";
import { ConsoleChrome } from "@/components/ConsoleChrome";
import { devPreviewChromeUser, isConsoleDevPreview } from "@/lib/devPreview";
import { devPreviewDemoRows } from "@/lib/devPreviewDemoRows";
import { countActionableSubmissions, normalizeSubmissionList } from "@/lib/submissionRow";
import { fetchDashboardStatsForOperator, fetchSubmissionsForOperator } from "@/lib/webInternal";
import type { ConsoleDashboardStats } from "@/lib/webInternal";

const PREVIEW_DASHBOARD_STATS: ConsoleDashboardStats = {
  membersTotal: 240,
  artistsTotal: 18,
  artworksTotal: 62,
  provenanceAuctionsTotal: 4,
  provenanceFixedPriceTotal: 11,
  certificatesIssuedTotal: 28,
};

export default async function ConsoleHomePage({ params }: { params: Promise<{ locale: string }> }) {
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

  let pendingSubmissionCount: number | null = null;
  let dashboardStats: ConsoleDashboardStats | null = null;
  let statsLoadFailed = false;

  if (preview) {
    pendingSubmissionCount = countActionableSubmissions(devPreviewDemoRows());
    dashboardStats = PREVIEW_DASHBOARD_STATS;
  } else {
    try {
      const rawList = await fetchSubmissionsForOperator(session!.user.id);
      pendingSubmissionCount = countActionableSubmissions(normalizeSubmissionList(rawList));
    } catch {
      pendingSubmissionCount = null;
    }
    try {
      dashboardStats = await fetchDashboardStatsForOperator(session!.user.id);
    } catch {
      dashboardStats = null;
      statsLoadFailed = true;
    }
  }

  const d = t.dashboard;

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview} locale={locale} labels={t.chrome} langLabels={t.lang}>
      <div className="border-b border-white/10 bg-[#141414] px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F6F4F0]">{d.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#F6F4F0]/70">{d.subtitle}</p>
        {statsLoadFailed ? (
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-amber-400/90">{d.statsLoadError}</p>
        ) : null}
      </div>

      <div className="grid gap-4 px-6 pt-8 md:grid-cols-3">
        <Link
          href={`/${locale}/review`}
          aria-label={
            pendingSubmissionCount !== null
              ? d.cardSubmissionsPendingCountTpl.replace("{count}", String(pendingSubmissionCount))
              : `${d.cardSubmissionsTitle}. ${d.cardSubmissionsCountUnavailable}`
          }
          className="group grid grid-cols-1 gap-4 rounded-lg border border-white/10 bg-[#161616] p-5 shadow-sm transition hover:border-[#DEB892]/35 hover:bg-[#1a1a1a] md:grid-cols-[minmax(0,1fr)_minmax(5.5rem,32%)] md:items-stretch md:gap-6 md:p-6"
        >
          <div className="flex min-h-0 min-w-0 flex-col">
            <h2 className="text-sm font-semibold text-[#F6F4F0]">{d.cardSubmissionsTitle}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[#F6F4F0]/65">{d.cardSubmissionsBody}</p>
            <span className="mt-4 text-sm font-medium text-[#DEB892] group-hover:underline">{d.cardSubmissionsCta} →</span>
          </div>
          <div className="flex min-h-0 w-full flex-col items-center justify-center border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            {pendingSubmissionCount !== null ? (
              <div className="flex w-full flex-col items-center justify-center">
                <span
                  className="block text-center font-display text-[clamp(2.75rem,10vw,4.5rem)] font-semibold leading-none tracking-tight text-[#DEB892] tabular-nums md:text-[clamp(3rem,4.2vw,4.75rem)]"
                  aria-hidden
                >
                  {pendingSubmissionCount}
                </span>
                <span
                  className="mt-2 block text-center font-mono text-[0.65rem] font-medium uppercase tracking-[0.28em] text-[#F6F4F0]/40"
                  aria-hidden
                >
                  {d.cardSubmissionsCountSuffix}
                </span>
              </div>
            ) : (
              <span
                className="block text-center font-mono text-3xl font-semibold text-[#F6F4F0]/35"
                title={d.cardSubmissionsCountUnavailable}
              >
                —
              </span>
            )}
          </div>
        </Link>
        <Link
          href={`/${locale}/payments`}
          className="group flex flex-col rounded-lg border border-white/10 bg-[#161616] p-5 shadow-sm transition hover:border-[#DEB892]/35 hover:bg-[#1a1a1a]"
        >
          <h2 className="text-sm font-semibold text-[#F6F4F0]">{d.cardPaymentsTitle}</h2>
          <p className="mt-2 flex-1 text-sm text-[#F6F4F0]/65">{d.cardPaymentsBody}</p>
          <span className="mt-3 inline-flex w-fit rounded-full border border-[#DEB892]/30 px-2 py-0.5 text-xs text-[#DEB892]">
            {d.cardPaymentsBadge}
          </span>
        </Link>
        <div className="flex flex-col rounded-lg border border-white/10 bg-[#161616] p-5">
          <h2 className="text-sm font-semibold text-[#F6F4F0]">{d.cardHealthTitle}</h2>
          <p className="mt-2 text-sm text-[#F6F4F0]/65">{d.cardHealthBody}</p>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-8">
        <h2 className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.32em] text-[#F6F4F0]/45">
          {d.statsSectionHeading}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardMetricCard
            title={d.statsMembersTitle}
            body={d.statsMembersBody}
            value={dashboardStats?.membersTotal ?? null}
            suffix={d.statsMembersSuffix}
            unavailableLabel={d.statsLoadError}
          />
          <DashboardMetricCard
            title={d.statsArtistsTitle}
            body={d.statsArtistsBody}
            value={dashboardStats?.artistsTotal ?? null}
            suffix={d.statsArtistsSuffix}
            unavailableLabel={d.statsLoadError}
          />
          <DashboardMetricCard
            title={d.statsArtworksTitle}
            body={d.statsArtworksBody}
            value={dashboardStats?.artworksTotal ?? null}
            suffix={d.statsArtworksSuffix}
            unavailableLabel={d.statsLoadError}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardMetricCard
            title={d.statsAuctionsTitle}
            body={d.statsAuctionsBody}
            value={dashboardStats?.provenanceAuctionsTotal ?? null}
            suffix={d.statsAuctionsSuffix}
            unavailableLabel={d.statsLoadError}
          />
          <DashboardMetricCard
            title={d.statsCustodyFixedTitle}
            body={d.statsCustodyFixedBody}
            value={dashboardStats?.provenanceFixedPriceTotal ?? null}
            suffix={d.statsCustodyFixedSuffix}
            unavailableLabel={d.statsLoadError}
          />
          <DashboardMetricCard
            title={d.statsCertificatesTitle}
            body={d.statsCertificatesBody}
            value={dashboardStats?.certificatesIssuedTotal ?? null}
            suffix={d.statsCertificatesSuffix}
            unavailableLabel={d.statsLoadError}
          />
        </div>
      </div>
    </ConsoleChrome>
  );
}
