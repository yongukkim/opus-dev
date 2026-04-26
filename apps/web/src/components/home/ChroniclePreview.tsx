import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { ChroniclePreviewPublicRow } from "@/lib/chronicleLedger";
import { withLocale } from "@/i18n/paths";
import type { Messages } from "@/i18n/types";
import { ChroniclePublicList } from "@/components/home/ChroniclePublicList";

/**
 * The Chronicle preview — PR-9 empty state; when `rows` is set, shows the
 * latest masked issuance lines from `storage/chronicle-entries.jsonl`
 * (written on operator approval).
 */
export function ChroniclePreview({
  locale,
  m,
  rows,
}: {
  locale: Locale;
  m: Messages;
  rows?: ChroniclePreviewPublicRow[];
}) {
  const c = m.home.chroniclePreview;
  const eventChips: ReadonlyArray<string> = [c.eventPrimary, c.eventSecondary, c.eventVaultNote];
  const hasRows = Boolean(rows?.length);

  return (
    <section
      className="border-t border-white/[0.05] py-16 md:py-20"
      aria-label={c.title}
    >
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.32em]">{c.kicker}</p>
        <h2 className="opus-text-metallic mt-3 font-display text-2xl tracking-wide md:text-3xl">
          {c.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-opus-warm/55">{hasRows ? c.recentLead : c.body}</p>

        {hasRows ? (
          <>
            <ChroniclePublicList locale={locale} m={m} rows={rows!} />
            <p className="mx-auto mt-8 max-w-lg text-center">
              <Link
                href={withLocale(locale, "/chronicle")}
                className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
              >
                {c.viewAllCta}
              </Link>
            </p>
          </>
        ) : (
          <div className="mx-auto mt-10 max-w-md rounded-xl border border-white/[0.08] bg-opus-slate/25 px-6 py-8 shadow-opus-card">
            <span className="inline-block rounded-full border border-opus-gold/35 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-opus-gold/85">
              {m.home.comingSoon}
            </span>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-hidden>
              {eventChips.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/[0.12] bg-white/[0.02] px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/70"
                >
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-5">
              <Link
                href={withLocale(locale, "/chronicle")}
                className="text-xs text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
              >
                {c.viewAllCta}
              </Link>
            </p>
          </div>
        )}

        <p className="mx-auto mt-8 max-w-md font-mono text-[0.62rem] uppercase tracking-[0.18em] text-opus-warm/45">
          {c.maskLegend}
        </p>
      </div>
    </section>
  );
}
