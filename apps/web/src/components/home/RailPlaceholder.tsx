import type { Messages } from "@/i18n/types";

/**
 * Reusable placeholder shell for a curation rail whose data wiring lands in a
 * follow-up PR (PR-4..PR-7 of the home redesign series; see
 * docs/home-redesign-curation-rails-and-omnisearch.md §3.4–§3.6 / §8).
 *
 * Renders a labelled empty rail at the same dimensions a real rail will use,
 * so the home IA does not visually shift when the real rail swaps in. The
 * "Coming soon" pill mirrors the language we already use elsewhere on the
 * site for in-flight surfaces.
 */
export function RailPlaceholder({
  title,
  body,
  comingSoonLabel,
  ariaLabel,
}: {
  title: string;
  body: string;
  comingSoonLabel: Messages["home"]["comingSoon"];
  ariaLabel: string;
}) {
  return (
    <section className="border-t border-white/[0.05] py-16 md:py-20" aria-label={ariaLabel}>
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="opus-text-metallic font-display text-2xl tracking-wide md:text-3xl">
              {title}
            </h2>
            <p className="mt-3 max-w-lg font-sans text-sm text-opus-warm/55">{body}</p>
          </div>
          <span className="shrink-0 rounded-full border border-opus-gold/35 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85">
            {comingSoonLabel}
          </span>
        </div>

        {/*
          Skeleton row keeps vertical rhythm equal to a real rail so the page
          height does not jump when this placeholder is replaced in PR-4..7.
        */}
        <ul
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          aria-hidden
        >
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="aspect-[4/5] overflow-hidden rounded-lg border border-white/[0.05] bg-gradient-to-b from-[#181818] to-opus-charcoal opacity-60"
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
