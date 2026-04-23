import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";

/**
 * The Chronicle preview — PR-9 of the home redesign series (spec §3.7).
 *
 * Phase 1 (this PR): a finalized empty-state card. We deliberately do NOT
 * render any synthetic from/to identifiers, sample emails, wallet
 * addresses, or invented event rows here. Instead the card visually
 * commits to the phase-2 vocabulary (event-type chips) and to the masking
 * format (`col-•••` legend) so the public contract is set in stone before
 * real data ever flows through.
 *
 * Phase 2 (separate PR, after the Chronicle write cutover for PRIMARY /
 * SECONDARY settles on the Prisma models): swaps the empty card for the
 * top 5 rows from `ChronicleEntry.orderBy(occurredAt desc).take(5)`. Every
 * displayed identifier MUST be passed through `maskSellerId` (or an
 * equivalent masker for from/to) — ISO 27001 A.12.4.1 / A.18.1.4,
 * SECURITY_GOVERNANCE.md §1, .cursorrules. The legend below is the public
 * commitment to that contract.
 */
export function ChroniclePreview({
  locale: _locale,
  m,
}: {
  locale: Locale;
  m: Messages;
}) {
  const c = m.home.chroniclePreview;
  const eventChips: ReadonlyArray<string> = [
    c.eventPrimary,
    c.eventSecondary,
    c.eventVaultNote,
  ];

  return (
    <section
      className="border-t border-white/[0.05] py-16 md:py-20"
      aria-label={c.title}
    >
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.32em]">
          The Chronicle
        </p>
        <h2 className="opus-text-metallic mt-3 font-display text-2xl tracking-wide md:text-3xl">
          {c.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-opus-warm/55">{c.body}</p>

        <div className="mx-auto mt-10 max-w-md rounded-xl border border-white/[0.08] bg-opus-slate/25 px-6 py-8 shadow-opus-card">
          <span className="inline-block rounded-full border border-opus-gold/35 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85">
            {m.home.comingSoon}
          </span>

          {/*
            Event-type chips visually commit to the phase-2 vocabulary
            without inventing any actor identifier. Decorative for AT
            because the surrounding section already announces the
            preview's purpose; AT users get the legend text below.
          */}
          <ul
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
            aria-hidden
          >
            {eventChips.map((label) => (
              <li
                key={label}
                className="rounded-full border border-white/[0.12] bg-white/[0.02] px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/70"
              >
                {label}
              </li>
            ))}
          </ul>

          <p className="mt-5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-opus-warm/45">
            {c.maskLegend}
          </p>
        </div>
      </div>
    </section>
  );
}
