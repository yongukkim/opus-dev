"use client";

import { useOmniSearch } from "./OmniSearchProvider";

/**
 * Header omni-search trigger button (spec §4.1). Renders a small `⌘K` chip
 * that opens the modal. The hint glyph is fixed to `⌘ K` to match the
 * spec mockup; the underlying provider listens for both `Cmd+K` and
 * `Ctrl+K` so Windows / Linux users still get the same keybinding even
 * though the chip shows the mac glyph.
 */
export function OmniSearchTrigger({ label }: { label: string }) {
  const { open } = useOmniSearch();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={label}
      title={label}
      className="hidden shrink-0 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.02] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-opus-warm/65 transition hover:border-opus-gold/45 hover:text-opus-gold-light sm:inline-flex"
    >
      <span aria-hidden>🔍</span>
      <span aria-hidden>⌘ K</span>
    </button>
  );
}
