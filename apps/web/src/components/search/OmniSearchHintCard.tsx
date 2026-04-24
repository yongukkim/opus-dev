"use client";

import { useOmniSearch } from "./OmniSearchProvider";

type Props = {
  /** `m.search.hintCardPrompt` — spec §3.2 home hint copy. */
  prompt: string;
  /** `m.search.hintCardAriaLabel` — full SR label (opens same modal as ⌘K). */
  ariaLabel: string;
  /** Optional line under the control (e.g. `m.hero.searchHint` for the ⌘K / Ctrl+K affordance). */
  shortcutNote?: string;
  /** Whether to hide the `shortcutNote` on very narrow viewports. */
  ja?: boolean;
};

/**
 * Home §3.2 — a single-column, search-bar-shaped control that opens the
 * omni-search modal (same as the header trigger + global shortcuts).
 * Sits on the first screen between `Hero` and `<main>`.
 */
export function OmniSearchHintCard({ prompt, ariaLabel, shortcutNote, ja }: Props) {
  const { open } = useOmniSearch();
  const noteClass = ja
    ? "mt-3 text-center font-mono text-[0.62rem] tracking-tight break-keep text-opus-warm/40"
    : "mt-3 text-center font-mono text-[0.62rem] uppercase tracking-[0.24em] text-opus-warm/40";

  return (
    <section className="border-b border-opus-gold/10 bg-opus-charcoal px-6 pb-10 pt-6 md:pb-12 md:pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={open}
          aria-label={ariaLabel}
          className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-opus-gold-light/50 focus-visible:ring-offset-2 focus-visible:ring-offset-opus-charcoal"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition group-hover:border-opus-gold/40 group-hover:bg-white/[0.06] md:px-5 md:py-4">
            <span className="shrink-0 text-base opacity-70" aria-hidden>
              🔍
            </span>
            <span
              className={
                ja
                  ? "min-w-0 flex-1 text-sm font-sans leading-snug tracking-tight break-keep text-opus-warm/50 group-hover:text-opus-warm/70"
                  : "min-w-0 flex-1 font-sans text-sm leading-snug tracking-wide text-opus-warm/50 group-hover:text-opus-warm/70"
              }
            >
              {prompt}
            </span>
            <span
              className="shrink-0 rounded-md border border-white/[0.1] bg-black/30 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-opus-warm/45"
              aria-hidden
            >
              ⌘ K
            </span>
          </div>
        </button>
        {shortcutNote?.trim() ? (
          <p className={noteClass} aria-hidden>
            {shortcutNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}
