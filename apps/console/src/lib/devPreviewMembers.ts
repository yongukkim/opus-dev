import type { ConsoleMemberRow } from "@/lib/webInternal";

export function devPreviewMemberRows(): ConsoleMemberRow[] {
  return [
    {
      id: "preview-user-1",
      name: "Kim Collector",
      email: "collector@preview.local",
      role: "collector",
      createdAt: "2025-11-02T09:00:00.000Z",
      emailVerified: true,
      artworkCount: null,
    },
    {
      id: "preview-user-2",
      name: "Sato Artist",
      email: "artist@preview.local",
      role: "artist",
      createdAt: "2025-12-10T14:30:00.000Z",
      emailVerified: true,
      artworkCount: 1,
    },
    {
      id: "preview-user-3",
      name: "OPUS Operator",
      email: "operator@preview.local",
      role: "operator",
      createdAt: "2026-01-05T08:15:00.000Z",
      emailVerified: false,
      artworkCount: null,
    },
  ];
}
