"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/types";

export function OperatorSessionBootstrap({ m }: { m: Messages }) {
  const s = m.operatorReview;
  const [pending, setPending] = useState(false);

  async function enable() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/operator/demo-session", { method: "POST" });
      if (!res.ok) {
        window.alert(s.alertFail);
        return;
      }
      window.location.reload();
    } catch {
      window.alert(s.alertFail);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
      <div className="border-b border-white/[0.06] px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
          {s.bootstrapHeading}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-opus-warm/60">{s.bootstrapBody}</p>
      </div>
      <div className="px-6 py-6">
        <button
          type="button"
          onClick={enable}
          disabled={pending}
          className={`opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition ${
            pending ? "cursor-not-allowed opacity-55" : "hover:opacity-95"
          }`}
        >
          {pending ? s.bootstrapPending : s.bootstrapCta}
        </button>
      </div>
    </div>
  );
}

