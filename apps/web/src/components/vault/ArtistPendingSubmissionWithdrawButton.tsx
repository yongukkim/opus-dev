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
      className="rounded-md border border-white/[0.14] bg-black/25 px-2.5 py-1.5 text-xs font-medium text-opus-warm/85 shadow-sm transition hover:border-opus-gold/35 hover:bg-opus-gold/[0.06] hover:text-opus-gold-light disabled:opacity-45"
    >
      {pending ? labels.working : labels.cta}
    </button>
  );
}
