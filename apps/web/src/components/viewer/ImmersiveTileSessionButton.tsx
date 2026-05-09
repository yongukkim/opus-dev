"use client";

import { useState } from "react";

export function ImmersiveTileSessionButton({
  submissionId,
  requestCta,
  resultLabel,
  errorLabel,
}: {
  submissionId: string;
  requestCta: string;
  resultLabel: string;
  errorLabel: string;
}) {
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setErr(null);
          setOut(null);
          void (async () => {
            try {
              const res = await fetch("/api/viewer/tile-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId }),
                credentials: "include",
              });
              const json = (await res.json()) as { ok?: boolean; error?: string; token?: string; note?: string };
              if (!res.ok || !json.ok) {
                setErr(json.error ?? errorLabel);
                return;
              }
              setOut(JSON.stringify({ token: json.token, note: json.note }, null, 2));
            } catch {
              setErr(errorLabel);
            } finally {
              setBusy(false);
            }
          })();
        }}
        className="opus-surface-metallic inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold tracking-wide text-black transition hover:opacity-95 disabled:opacity-50"
      >
        {busy ? "…" : requestCta}
      </button>
      {err ? <p className="text-sm text-red-300/90">{err}</p> : null}
      {out ? (
        <div className="rounded-lg border border-white/[0.08] bg-black/30 p-3">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45">{resultLabel}</p>
          <pre className="mt-2 max-h-48 overflow-auto text-[0.65rem] leading-relaxed text-opus-warm/70">{out}</pre>
        </div>
      ) : null}
    </div>
  );
}
