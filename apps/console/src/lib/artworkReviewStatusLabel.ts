import type { ConsoleMessages } from "@/i18n/types";
import type { ConsoleArtworkRow } from "@/lib/webInternal";

export function artworkReviewStatusLabel(
  labels: ConsoleMessages["artworks"],
  status: ConsoleArtworkRow["reviewStatus"],
): string {
  switch (status) {
    case "approved":
      return labels.statusApproved;
    case "changes_requested":
      return labels.statusChanges;
    case "rejected":
      return labels.statusRejected;
    case "withdrawn":
      return labels.statusWithdrawn;
    default:
      return labels.statusPending;
  }
}
