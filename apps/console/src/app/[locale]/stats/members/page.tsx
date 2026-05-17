import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleMembersTable } from "@/components/ConsoleMembersTable";
import { ConsoleStatsPageShell } from "@/components/ConsoleStatsPageShell";
import { devPreviewMemberRows } from "@/lib/devPreviewMembers";
import { loadConsoleStatsPage } from "@/lib/loadConsoleStatsPage";
import { fetchMembersForOperator } from "@/lib/webInternal";

export default async function ConsoleMembersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, preview, chromeUser, t, actingUserId } = await loadConsoleStatsPage(params);
  const m = t.members;

  let rows = devPreviewMemberRows();
  let total = rows.length;
  let loadError: string | null = null;

  if (!preview && actingUserId) {
    try {
      const data = await fetchMembersForOperator(actingUserId);
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
      <ConsoleStatsPageShell
        locale={locale}
        backLabel={m.backToDashboard}
        title={m.title}
        subtitle={m.subtitle}
        totalLine={loadError ? null : m.totalTpl.replace("{count}", String(total))}
        loadError={loadError}
      >
        <ConsoleMembersTable rows={rows} labels={m} locale={locale} />
      </ConsoleStatsPageShell>
    </ConsoleChrome>
  );
}
