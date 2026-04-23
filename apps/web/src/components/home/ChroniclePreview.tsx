import type { Messages } from "@/i18n/types";

/**
 * The Chronicle preview — placeholder for PR-3 of the home redesign series.
 *
 * Real data wiring (recent ChronicleEntry rows with masked from / to user
 * identifiers) lands in PR-9 once the Chronicle write cutover for PRIMARY
 * (Releases) and SECONDARY (Provenance) settles on the Prisma models that
 * landed in #14. See spec §3.7 of
 * docs/home-redesign-curation-rails-and-omnisearch.md.
 *
 * ISO 27001 A.12.4.1 / A.18.1.4 (§5, §7): when this becomes real, every
 * displayed identifier must use the existing maskSellerId pattern. The
 * placeholder text below already commits us to that contract publicly.
 */
export function ChroniclePreview({
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
    <section
      className="border-t border-white/[0.05] py-16 md:py-20"
      aria-label={ariaLabel}
    >
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.32em]">
          The Chronicle
        </p>
        <h2 className="opus-text-metallic mt-3 font-display text-2xl tracking-wide md:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-opus-warm/55">{body}</p>

        <div className="mx-auto mt-10 max-w-md rounded-xl border border-white/[0.08] bg-opus-slate/25 px-6 py-8 shadow-opus-card">
          <span className="inline-block rounded-full border border-opus-gold/35 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85">
            {comingSoonLabel}
          </span>
          {/*
            Three faint rule lines stand in for the masked from → to rows that
            PR-9 will render. Keep this skeleton aria-hidden — it is purely
            visual rhythm so the section height does not jump on swap.
          */}
          <ul className="mt-6 space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-3 rounded bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-white/[0.05] opacity-70"
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
