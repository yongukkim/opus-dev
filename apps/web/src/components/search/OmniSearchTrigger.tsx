"use client";

import { useOmniSearch } from "./OmniSearchProvider";

/**
 * Header search trigger (spec §4.1). Visible chip uses human copy (`chip`),
 * e.g. KO「검색」— not ⌘K. Cmd/Ctrl+K still work via OmniSearchProvider.
 */
export function OmniSearchTrigger({ label, chip }: { label: string; chip: string }) {
  const { open } = useOmniSearch();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={label}
      title={label}
      className="hidden shrink-0 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.02] px-3 py-1 text-[0.7rem] text-opus-warm/70 transition hover:border-opus-gold/45 hover:text-opus-gold-light sm:inline-flex"
    >
      <span aria-hidden>🔍</span>
      <span aria-hidden className="font-sans">
        {chip}
      </span>
    </button>
  );
}
