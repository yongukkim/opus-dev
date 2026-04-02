"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";

export function ArtistKycStartPanel({
  locale,
  m,
  returnTo,
}: {
  locale: Locale;
  m: Messages;
  returnTo: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function completeDemoKyc() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/artist/kyc/complete", { method: "POST" });
      if (!res.ok) {
        window.alert(m.artistKyc.startNotReadyAlert);
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      window.alert(m.artistKyc.startNotReadyAlert);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
      <div className="border-b border-white/[0.06] px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-opus-warm/45">
          {m.artistKyc.startHeading}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-opus-warm/70">{m.artistKyc.startBody}</p>
      </div>

      <div className="px-6 py-6">
        <button
          type="button"
          onClick={completeDemoKyc}
          disabled={pending}
          className={`opus-surface-metallic inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.12em] text-black transition ${
            pending ? "cursor-not-allowed opacity-55" : "hover:opacity-95"
          }`}
        >
          {pending ? m.artistKyc.startPending : m.artistKyc.startCompleteDemo}
        </button>
        <p className="mt-4 text-center text-xs text-opus-warm/45">{m.artistKyc.startNote}</p>
      </div>
    </div>
  );
}

