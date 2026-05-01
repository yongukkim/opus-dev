import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { devPreviewChromeUser, isConsoleDevPreview } from "@/lib/devPreview";
import { devPreviewDemoRows } from "@/lib/devPreviewDemoRows";
import { fetchSubmissionsForOperator } from "@/lib/webInternal";
import { normalizeSubmissionList } from "@/lib/submissionRow";
import { ConsoleChrome } from "@/components/ConsoleChrome";
import { ConsoleReviewWorkspace } from "@/components/ConsoleReviewWorkspace";

export default async function ReviewPage() {
  const preview = isConsoleDevPreview();
  const session = preview ? null : await auth();

  if (!preview && (!session?.user?.id || session.user.role !== "operator")) {
    redirect("/login");
  }

  const chromeUser = preview ? devPreviewChromeUser() : session!.user;

  let rows: ReturnType<typeof normalizeSubmissionList> = [];
  let loadError: string | null = null;

  if (preview) {
    rows = devPreviewDemoRows();
  } else {
    try {
      const raw = await fetchSubmissionsForOperator(session!.user.id);
      rows = normalizeSubmissionList(raw);
    } catch {
      loadError =
        "Could not load submissions. Check OPUS_WEB_ORIGIN, OPUS_INTERNAL_API_SECRET, and network access.";
    }
  }

  return (
    <ConsoleChrome user={chromeUser} previewMode={preview}>
      <div className="px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Submissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review artwork registrations (same data as the storefront operator tools).
        </p>
        {loadError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
        ) : (
          <ConsoleReviewWorkspace initialRows={rows} readOnlyPreview={preview} />
        )}
      </div>
    </ConsoleChrome>
  );
}
