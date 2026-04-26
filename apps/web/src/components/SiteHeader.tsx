import Link from "next/link";
import { auth } from "@/auth";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SiteHeaderAuth } from "./SiteHeaderAuth";

/**
 * Fixed top bar — charcoal glass, gold accents (Classic Luxury).
 * Locale control: KO / EN / JA (pattern: marketplace.aline.team header language control).
 * Narrow viewports: brand + locale on row 1, primary nav wraps on row 2 (no horizontal scroll).
 */
export async function SiteHeader({ locale, m }: { locale: Locale; m: Messages }) {
  const session = await auth();
  const isArtist = session?.user?.role === "artist";
  const ja = locale === "ja";
  const artistSignupLabel = m.artistSignup?.title ?? m.signup.title;
  const navItemClass = ja
    ? "shrink-0 text-[0.65rem] font-medium tracking-tight break-keep text-opus-warm/65 transition hover:text-opus-gold sm:text-[0.7rem] md:text-xs"
    : "shrink-0 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-opus-warm/65 transition hover:text-opus-gold sm:text-[0.7rem] sm:tracking-[0.22em] md:text-xs md:tracking-[0.28em]";
  const authItemClass = ja
    ? "hidden shrink-0 font-mono text-[0.65rem] tracking-tight break-keep text-opus-warm/55 transition hover:text-opus-gold sm:inline"
    : "hidden shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/55 transition hover:text-opus-gold sm:inline";
  const authItemClassMobile = ja
    ? "inline shrink-0 font-mono text-[0.65rem] tracking-tight break-keep text-opus-warm/55 transition hover:text-opus-gold"
    : "inline shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-opus-warm/55 transition hover:text-opus-gold";

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 min-h-[var(--opus-site-header-height)] border-b border-white/[0.09] bg-opus-charcoal/72 backdrop-blur-xl md:flex md:h-[var(--opus-site-header-height)] md:min-h-0"
      role="banner"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1.5 px-4 py-2 sm:px-6 md:h-full md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-3 md:py-0 md:px-10">
        <div className="flex min-h-0 min-w-0 items-center justify-between gap-2 md:shrink-0">
          <Link
            href={withLocale(locale, "/")}
            className="opus-text-metallic shrink-0 font-display text-lg font-semibold tracking-[0.42em] transition hover:opacity-90 md:text-xl"
          >
            OPUS
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-1 md:hidden">
            <SiteHeaderAuth
              variant="compact"
              locale={locale}
              signInLabel={m.auth.signIn}
              signUpLabel={m.signup.title}
              signOutLabel={m.auth.signOut}
              userEmail={session?.user?.email}
            />
            {isArtist ? (
              <Link href={withLocale(locale, "/vault")} className={authItemClassMobile}>
                {m.nav.vault}
              </Link>
            ) : (
              <Link href={withLocale(locale, "/artist-signup")} className={authItemClassMobile}>
                {artistSignupLabel}
              </Link>
            )}
            <LocaleSwitcher ariaLabel={m.a11y.language} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 md:h-full md:flex-row md:items-center md:justify-end md:gap-3 md:py-0">
          <nav
            className="flex w-full flex-wrap justify-center gap-x-2 gap-y-1.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-3 md:max-w-[min(100%,calc(100vw-11rem))] md:flex-nowrap md:justify-end md:gap-5 md:overflow-x-auto md:py-1 lg:gap-8 lg:gap-10 [&::-webkit-scrollbar]:hidden"
            aria-label={m.a11y.primaryNav}
          >
            {/*
              Primary nav: Releases → Curation → Artists → Chronicle (issuance)
              → Provenance → auction-mode provenance index.
            */}
            <Link href={withLocale(locale, "/releases")} className={navItemClass}>
              {m.nav.releases}
            </Link>
            <Link href={withLocale(locale, "/curation")} className={navItemClass}>
              {m.nav.curation}
            </Link>
            <Link href={withLocale(locale, "/featured-artists")} className={navItemClass}>
              {m.nav.artists}
            </Link>
            <Link href={withLocale(locale, "/chronicle")} className={navItemClass}>
              {m.nav.chronicle}
            </Link>
            <Link href={withLocale(locale, "/provenance")} className={navItemClass}>
              {m.nav.provenance}
            </Link>
            <Link href={withLocale(locale, "/provenance?saleMode=auction")} className={navItemClass}>
              {m.nav.provenanceAuctions}
            </Link>
          </nav>
          <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
            <SiteHeaderAuth
              locale={locale}
              signInLabel={m.auth.signIn}
              signUpLabel={m.signup.title}
              signOutLabel={m.auth.signOut}
              userEmail={session?.user?.email}
            />
            {isArtist ? (
              <Link href={withLocale(locale, "/vault")} className={authItemClass}>
                {m.nav.vault}
              </Link>
            ) : (
              <Link href={withLocale(locale, "/artist-signup")} className={authItemClass}>
                {artistSignupLabel}
              </Link>
            )}
            <LocaleSwitcher ariaLabel={m.a11y.language} />
          </div>
        </div>
      </div>
    </header>
  );
}
