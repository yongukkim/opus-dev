"use client";

import { commaTagsContain, toggleCommaTag } from "@/lib/toggleCommaTag";

function chipClass(active: boolean, disabled: boolean): string {
  const base =
    "rounded-full border px-2.5 py-1 text-left text-xs font-sans transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-opus-gold/50";
  if (disabled) {
    return `${base} cursor-not-allowed border-white/[0.08] text-opus-warm/35`;
  }
  if (active) {
    return `${base} cursor-pointer border-opus-gold/45 bg-opus-gold/[0.12] text-opus-warm/90`;
  }
  return `${base} cursor-pointer border-white/[0.14] bg-black/20 text-opus-warm/75 hover:border-opus-gold/35 hover:bg-black/30`;
}

/**
 * Quick-pick chips under the genre control; toggles tokens in the comma-separated tags field.
 */
export function GenreKeywordQuickPick({
  label,
  hint,
  keywords,
  tags,
  onTagsChange,
  disabled = false,
}: {
  label: string;
  hint: string;
  keywords: readonly string[];
  tags: string;
  onTagsChange: (next: string) => void;
  disabled?: boolean;
}) {
  if (keywords.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/50">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={label}>
        {keywords.map((kw) => {
          const active = commaTagsContain(tags, kw);
          return (
            <button
              key={kw}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onTagsChange(toggleCommaTag(tags, kw))}
              className={chipClass(active, disabled)}
            >
              {kw}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-opus-warm/45">{hint}</p>
    </div>
  );
}
