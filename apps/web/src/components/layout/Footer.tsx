import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

/**
 * Deep charcoal footer, four-column IA. LEGAL links to public docs + Terms.
 * ISO 27001 A.18.1.4 (§7) Privacy by Design
 * KO: 법적 고지·문서 링크를 일관된 푸터에서 제공해 이용자의 알 권리를 지원합니다.
 * JA: 法的表示・文書へのリンクをフッターで一貫提供し、利用者の知情权を支援します。
 * EN: Legal notices and document links are grouped in the footer to support user transparency.
 */
function VaultEnclosureIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="6"
        y="6"
        width="44"
        height="44"
        rx="9"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeOpacity="0.5"
        fill="none"
      />
      <path
        d="M28 14.5l10.2 4.6v9.4c0 6.3-4.4 12.2-10.2 13.8-5.8-1.6-10.2-7.5-10.2-13.8v-9.4L28 14.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M28 22v10.5M23.5 27.25h9"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
    </svg>
  );
}

export function Footer({ locale, m }: { locale: Locale; m: Messages }) {
  const ja = locale === "ja";
  const linkClass = ja
    ? "block text-sm font-medium text-opus-gold/55 transition hover:text-opus-gold/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-opus-gold/40 tracking-tight break-keep"
    : "block text-sm text-opus-gold/50 transition hover:text-opus-gold/85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-opus-gold/40";

  const headingClass = ja
    ? "font-mono text-[0.65rem] font-semibold tracking-tight text-opus-gold/60"
    : "font-mono text-[0.65rem] font-medium uppercase tracking-[0.38em] text-opus-gold/55";

  return (
    <footer
      className="border-t border-white/[0.06] bg-[#060606] text-opus-gold/55"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <p className={headingClass}>Service</p>
            <p
              className={`opus-text-metallic-soft mt-4 font-display text-xs ${ja ? "font-semibold tracking-tight" : "tracking-[0.2em]"}`}
            >
              OPUS
            </p>
            <nav className="mt-6 flex flex-col gap-2.5" aria-label="Service links">
              <Link href={withLocale(locale, "/")} className={linkClass}>
                Home
              </Link>
              <Link href={withLocale(locale, "/artworks")} className={linkClass}>
                {m.footer.archive}
              </Link>
              <Link href={withLocale(locale, "/vault")} className={linkClass}>
                {m.footer.vault}
              </Link>
            </nav>
          </div>

          <div>
            <p className={headingClass}>The Chronicle</p>
            <p
              className={`mt-6 text-sm leading-relaxed text-opus-gold/42 ${ja ? "tracking-tight break-keep font-medium" : ""}`}
            >
              {m.footer.chronicleTrust}
            </p>
          </div>

          <div>
            <p className={headingClass}>Legal</p>
            <nav className="mt-6 flex flex-col gap-2.5" aria-label="Legal documents">
              <a href="/docs/privacy-policy.md" className={linkClass}>
                {m.footer.privacy}
              </a>
              <a href="/docs/specified-commercial.md" className={linkClass}>
                {m.footer.legal}
              </a>
              <Link href={withLocale(locale, "/terms")} className={linkClass}>
                {m.footer.terms}
              </Link>
            </nav>
          </div>

          <div>
            <p className={headingClass}>Contact</p>
            <p className="mt-6 text-sm leading-relaxed text-opus-gold/42">
              Placeholder — replace before launch.
            </p>
            <p className="mt-4 font-mono text-xs text-opus-gold/45">
              <span className="block text-opus-gold/35">General</span>
              <a href="mailto:support@opus.example" className="mt-1 inline-block hover:text-opus-gold/80">
                support@opus.example
              </a>
            </p>
            <p className="mt-3 font-mono text-xs text-opus-gold/45">
              <span className="block text-opus-gold/35">Legal &amp; privacy</span>
              <a href="mailto:legal@opus.example" className="mt-1 inline-block hover:text-opus-gold/80">
                legal@opus.example
              </a>
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center border-t border-white/[0.05] pt-10">
          <div className="text-[#c9a87a] motion-safe:animate-vault-enclosure-glow">
            <VaultEnclosureIcon className="h-11 w-11" />
          </div>
          <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.32em] text-opus-gold/45">
            Secured by The Vault
          </p>
        </div>

        <p className="mt-10 text-center font-mono text-[0.65rem] tracking-[0.18em] text-opus-gold/30">
          © {new Date().getFullYear()} OPUS
        </p>
      </div>
    </footer>
  );
}
