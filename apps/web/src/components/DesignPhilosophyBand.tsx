import type { Messages } from "@/i18n/types";

/**
 * Surfaces CLAUDE.md design philosophy on the public site — layout copy only.
 */
export function DesignPhilosophyBand({ m }: { m: Messages }) {
  const d = m.design;
  return (
    <div
      className="border-b border-opus-gold/10 bg-opus-charcoal/95"
      role="note"
      aria-label={m.a11y.designPhilosophy}
    >
      <div className="mx-auto max-w-6xl px-6 py-5 md:px-10 md:py-6">
        <p className="opus-text-metallic font-display text-[0.7rem] font-semibold uppercase tracking-[0.38em] md:text-xs md:tracking-[0.42em]">
          {d.title}
        </p>
        <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-opus-warm/58 md:text-[0.95rem]">
          {d.body}
        </p>
        <p className="mt-2 max-w-3xl font-sans text-xs leading-relaxed text-opus-warm/40 md:text-sm">{d.note}</p>
      </div>
    </div>
  );
}
