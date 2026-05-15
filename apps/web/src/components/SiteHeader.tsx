import Link from "next/link";
import { auth } from "@/auth";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SiteHeaderAuth } from "./SiteHeaderAuth";
import { SiteHeaderMobileNav, type SiteHeaderNavLink } from "./SiteHeaderMobileNav";

/**
 * Fixed top bar — charcoal glass, gold accents (Classic Luxury).
 * Locale control: KO / EN / JA (pattern: marketplace.aline.team header language control).
 * Mobile: single row with hamburger drawer; md+: inline primary nav.
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

  const primaryNavLinks: SiteHeaderNavLink[] = [
    { href: withLocale(locale, "/about"), label: m.nav.about },
    { href: withLocale(locale, "/releases"), label: m.nav.releases },
    { href: withLocale(locale, "/featured-artists"), label: m.nav.artists },
    { href: withLocale(locale, "/provenance?saleMode=fixed"), label: m.nav.provenanceOnSale },
    { href: withLocale(locale, "/provenance?saleMode=auction"), label: m.nav.provenanceAuctions },
    { href: withLocale(locale, "/vault/collection"), label: m.nav.vault },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 h-[var(--opus-site-header-height)] border-b border-white/[0.09] bg-opus-charcoal/72 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 md:gap-3 md:px-10">
        <Link
          href={withLocale(locale, "/")}
          className="opus-text-metallic shrink-0 font-display text-lg font-semibold tracking-[0.42em] transition hover:opacity-90 md:text-xl"
        >
          OPUS
        </Link>

        <nav
          className="hidden min-w-0 flex-1 flex-nowrap items-center justify-end gap-5 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex lg:gap-8 [&::-webkit-scrollbar]:hidden"
          aria-label={m.a11y.primaryNav}
        >
          {primaryNavLinks.map((item) => (
            <Link key={item.href} href={item.href} className={navItemClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-x-2 gap-y-1 md:gap-3">
          <SiteHeaderMobileNav
            links={primaryNavLinks}
            menuLabel={m.a11y.primaryNav}
            openLabel={m.a11y.openMenu}
            closeLabel={m.a11y.closeMenu}
            ja={ja}
          />
          <div className="md:hidden">
            <SiteHeaderAuth
              variant="compact"
              locale={locale}
              signInLabel={m.auth.signIn}
              signUpLabel={m.signup.title}
              signOutLabel={m.auth.signOut}
              userEmail={session?.user?.email}
            />
          </div>
          {!isArtist ? (
            <Link href={withLocale(locale, "/artist-signup")} className={`${authItemClassMobile} md:hidden`}>
              {artistSignupLabel}
            </Link>
          ) : null}
          <div className="hidden items-center gap-2 md:flex md:gap-3">
            <SiteHeaderAuth
              locale={locale}
              signInLabel={m.auth.signIn}
              signUpLabel={m.signup.title}
              signOutLabel={m.auth.signOut}
              userEmail={session?.user?.email}
            />
            {!isArtist ? (
              <Link href={withLocale(locale, "/artist-signup")} className={authItemClass}>
                {artistSignupLabel}
              </Link>
            ) : null}
            <LocaleSwitcher ariaLabel={m.a11y.language} />
          </div>
          <div className="md:hidden">
            <LocaleSwitcher ariaLabel={m.a11y.language} />
          </div>
        </div>
      </div>
    </header>
  );
}
