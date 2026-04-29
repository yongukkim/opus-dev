"use client";

import { useCallback, useId, useState } from "react";

type Labels = {
  kicker: string;
  title: string;
  body: string;
  copy: string;
  copied: string;
  copyFailed: string;
};

/**
 * ISO 27001 A.18.1.4 (§7) — internal identifier exposure
 * KO: Prisma 내부 id는 운영 빌드에서 숨기고, 비프로덕션에서만 시드 정렬용으로 표시한다.
 * JA: Prisma内部IDは本番では隠し、非本番でのみシード整合用に表示する。
 * EN: Hide Prisma internal ids in production by default; optional `OPUS_SHOW_DEV_USER_ID_PANEL=true`
 *     enables the panel briefly for seed alignment (unset before GA).
 */
export function VaultDevSessionUserIdPanel({ userId, labels }: { userId: string; labels: Labels }) {
  const panelId = useId();
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setStatus("ok");
      window.setTimeout(() => setStatus("idle"), 2200);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = userId;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      setStatus(ok ? "ok" : "err");
      if (ok) window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("err");
    }
  }, [userId]);

  return (
    <div
      className="border-b border-amber-400/25 bg-amber-500/[0.1] px-4 py-3 md:px-8"
      role="region"
      aria-labelledby={`${panelId}-title`}
    >
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-amber-200/75">{labels.kicker}</p>
      <p id={`${panelId}-title`} className="mt-1 text-sm font-medium text-amber-50/95">
        {labels.title}
      </p>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-amber-100/80">{labels.body}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <code className="break-all rounded border border-white/[0.12] bg-black/30 px-2 py-1.5 font-mono text-[0.7rem] text-opus-warm/90">
          {userId}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 rounded-md border border-amber-300/45 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-50 transition hover:border-amber-200/55 hover:bg-amber-400/25"
        >
          {labels.copy}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {status === "ok" ? labels.copied : status === "err" ? labels.copyFailed : ""}
      </p>
      {status === "ok" ? (
        <p className="mt-2 text-xs text-emerald-200/90" aria-hidden>
          {labels.copied}
        </p>
      ) : null}
      {status === "err" ? (
        <p className="mt-2 text-xs text-red-200/85" aria-hidden>
          {labels.copyFailed}
        </p>
      ) : null}
    </div>
  );
}
