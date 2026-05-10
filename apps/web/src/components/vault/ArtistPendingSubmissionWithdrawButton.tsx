"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArtistPendingSubmissionWithdrawButton({
  submissionId,
  labels,
}: {
  submissionId: string;
  labels: {
    cta: string;
    confirm: string;
    working: string;
    failed: string;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onWithdraw() {
    if (!window.confirm(labels.confirm)) return;
    setPending(true);
    try {
      const res = await fetch(`/api/artwork-submissions/${encodeURIComponent(submissionId)}/withdraw`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        window.alert(labels.failed);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onWithdraw()}
      className="text-xs text-opus-warm/50 underline-offset-4 transition hover:text-opus-warm/80 hover:underline disabled:opacity-40"
    >
      {pending ? labels.working : labels.cta}
    </button>
  );
}
