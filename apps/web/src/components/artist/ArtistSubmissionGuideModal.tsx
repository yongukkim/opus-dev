"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtistSubmissionGuideMessages } from "@/i18n/types";

const TOTAL = 6;

function progressLabel(tpl: string, current: number): string {
  return tpl.replace("{current}", String(current)).replace("{total}", String(TOTAL));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-white/[0.07] py-3 sm:grid-cols-[minmax(0,7rem)_1fr] sm:gap-4">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-gold/80">{label}</p>
      <p className="text-sm leading-relaxed text-opus-warm/75">{value}</p>
    </div>
  );
}

function Bullets({ items }: { items: [string, string] }) {
  return (
    <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-opus-warm/75">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

export function ArtistSubmissionGuideModal({ g }: { g: ArtistSubmissionGuideMessages }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(TOTAL - 1, i + 1));
  }, []);
  const goPrev = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  const onComplete = useCallback(async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/artist-submission-guide/complete", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setErr(g.completeFailed);
        return;
      }
      router.refresh();
    } catch {
      setErr(g.completeFailed);
    } finally {
      setBusy(false);
    }
  }, [g.completeFailed, router]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    if (dx < -48) goNext();
    else if (dx > 48) goPrev();
  };

  const cardTitleId = "opus-artist-guide-title";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={cardTitleId}
        className="relative flex max-h-[min(90vh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-opus-charcoal shadow-2xl"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="border-b border-white/[0.08] px-5 py-4">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-opus-warm/45">
            {progressLabel(g.progressTpl, idx + 1)}
          </p>
          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: TOTAL }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${i === idx ? "bg-opus-gold" : "bg-opus-warm/25"}`}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <h2 id={cardTitleId} className="font-display text-lg font-semibold tracking-tight text-opus-warm sm:text-xl">
            {idx === 0 && g.card0Title}
            {idx === 1 && g.step1Title}
            {idx === 2 && g.step2Title}
            {idx === 3 && g.step3Title}
            {idx === 4 && g.step4Title}
            {idx === 5 && g.step5Title}
          </h2>

          {idx === 0 ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-relaxed text-opus-warm/75">{g.card0Lead}</p>
              <div className="rounded-xl border border-white/[0.08] bg-black/20 px-3">
                <Row label={g.rowCopyrightL} value={g.rowCopyrightV} />
                <Row label={g.rowSettlementL} value={g.rowSettlementV} />
                <Row label={g.rowDataL} value={g.rowDataV} />
                <Row label={g.rowEditionL} value={g.rowEditionV} />
              </div>
            </div>
          ) : null}

          {idx === 1 ? (
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-opus-warm/75">{g.step1Lead}</p>
              <Bullets items={[g.step1Bullet1, g.step1Bullet2]} />
            </div>
          ) : null}

          {idx === 2 ? (
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-opus-warm/75">{g.step2Lead}</p>
              <Bullets items={[g.step2Bullet1, g.step2Bullet2]} />
            </div>
          ) : null}

          {idx === 3 ? (
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-opus-warm/75">{g.step3Lead}</p>
              <Bullets items={[g.step3Bullet1, g.step3Bullet2]} />
            </div>
          ) : null}

          {idx === 4 ? (
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-opus-warm/75">{g.step4Lead}</p>
              <Bullets items={[g.step4Bullet1, g.step4Bullet2]} />
            </div>
          ) : null}

          {idx === 5 ? (
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-opus-warm/75">{g.step5Lead}</p>
              <Bullets items={[g.step5Bullet1, g.step5Bullet2]} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/[0.08] px-4 py-4">
          {err ? <p className="mb-3 text-center text-xs text-red-200/90">{err}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={idx === 0 || busy}
              onClick={goPrev}
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-opus-warm/70 transition hover:border-opus-gold/35 hover:text-opus-gold disabled:cursor-not-allowed disabled:opacity-35"
            >
              {g.prev}
            </button>
            {idx < TOTAL - 1 ? (
              <button
                type="button"
                disabled={busy}
                onClick={goNext}
                className="opus-surface-metallic rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:opacity-95 disabled:opacity-60"
              >
                {g.next}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onComplete()}
                className="opus-surface-metallic rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:opacity-95 disabled:opacity-60"
              >
                {busy ? "…" : g.completeCta}
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-[0.65rem] text-opus-warm/40">{g.swipeHint}</p>
        </div>
      </div>
    </div>
  );
}
