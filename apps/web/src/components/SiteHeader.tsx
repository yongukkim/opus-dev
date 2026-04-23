import Link from "next/link";
import { auth } from "@/auth";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { OmniSearchTrigger } from "./search/OmniSearchTrigger";
import { SiteHeaderAuth } from "./SiteHeaderAuth";

/**
 * Fixed top bar — charcoal glass, gold accents (Classic Luxury).
 * Locale control: KO / EN / JA (pattern: marketplace.aline.team).
 */
export async function SiteHeader({ locale, m }: { locale: Locale; m: Messages }) {
  const session = await auth();
  const ja = locale === "ja";
  const artistSignupLabel = m.artistSignup?.title ?? m.signup.title;
  const navItemClass = ja
    ? "shrink-0 text-[0.7rem] font-medium tracking-tight break-keep text-opus-warm/65 transition hover:text-opus-gold md:text-xs"
    : "shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-opus-warm/65 transition hover:text-opus-gold md:text-xs md:tracking-[0.28em]";
  const authItemClass = ja
    ? "hidden shrink-0 font-mono text-[0.65rem] tracking-tight break-keep text-opus-warm/55 transition hover:text-opus-gold sm:inline"
    : "hidden shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-warm/55 transition hover:text-opus-gold sm:inline";

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.09] bg-opus-charcoal/72 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 md:px-10">
        <Link
          href={withLocale(locale, "/")}
          className="opus-text-metallic shrink-0 font-display text-lg font-semibold tracking-[0.42em] transition hover:opacity-90 md:text-xl"
        >
          OPUS
        </Link>
        {/* LocaleSwitcher stays visible: shrink-0 + nav scrolls on narrow widths */}
        <div className="flex min-w-0 max-w-[min(100%,calc(100vw-5.5rem))] flex-1 items-center justify-end gap-2 sm:max-w-none sm:gap-3 md:gap-6">
          <nav
            className="flex min-w-0 shrink items-center justify-end gap-3 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 md:gap-8 lg:gap-10 [&::-webkit-scrollbar]:hidden"
            aria-label={m.a11y.primaryNav}
          >
            {/*
              Primary nav order mirrors the home IA after PR-11 / PR-12:
              Releases → Curation → Artists → Provenance → Vault → Legal.
              Curation / Artists land between the two channels (Releases =
              PRIMARY, Provenance = SECONDARY) so the IA reads as
              "what's new → operator-curated views → custody history".
            */}
            <Link href={withLocale(locale, "/releases")} className={navItemClass}>
              {m.nav.releases}
            </Link>
            <Link href={withLocale(locale, "/curation")} className={navItemClass}>
              {m.nav.curation}
            </Link>
            <Link
              href={withLocale(locale, "/featured-artists")}
              className={navItemClass}
            >
              {m.nav.artists}
            </Link>
            <Link href={withLocale(locale, "/provenance")} className={navItemClass}>
              {m.nav.provenance}
            </Link>
            <Link href={withLocale(locale, "/vault")} className={navItemClass}>
              {m.nav.vault}
            </Link>
            <Link
              href={withLocale(locale, "/legal/specified-commercial")}
              className={`hidden sm:inline ${navItemClass}`}
            >
              {m.nav.legal}
            </Link>
          </nav>
          {/* PR-8: ⌘K omni-search trigger (spec §4.1). Hidden < sm to keep
              the mobile bar uncluttered; the keyboard shortcut still works. */}
          <OmniSearchTrigger label={m.search.triggerLabel} />
          <SiteHeaderAuth
            locale={locale}
            signInLabel={m.auth.signIn}
            signUpLabel={m.signup.title}
            signOutLabel={m.auth.signOut}
            userEmail={session?.user?.email}
          />
          <Link href={withLocale(locale, "/artist-signup")} className={authItemClass}>
            {artistSignupLabel}
          </Link>
          <LocaleSwitcher ariaLabel={m.a11y.language} />
        </div>
      </div>
    </header>
  );
}
