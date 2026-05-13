import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { sanitizeReturnTo } from "@/lib/returnTo";
import Link from "next/link";
import { UnifiedAuthSection } from "@/components/auth/UnifiedAuthSection";
import { storefrontSsoConfigured } from "@/lib/storefrontSso";

type Props = { params: Promise<{ locale: string }> };

// ISO 27001 A.9.4.2 (§2) — OAuth readiness must reflect runtime env (e.g. /etc/opus/opus.env), not `next build` (no Google secrets in CI).
// KO: Docker 런타임의 AUTH_GOOGLE_* 여부로 버튼 활성화를 판단해야 정적 프리렌더에 false가 고정되지 않는다.
// JA: Docker ランタイムの AUTH_GOOGLE_* でボタン可否を判定し、静的プリレンダに false が固定されないようにする。
// EN: Gate the Google row on runtime env so static prerender does not freeze “not configured” from the image build.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<{ returnTo?: string; role?: string; verify?: string }> }) {
  const { locale: raw } = await params;
  const { returnTo: returnToParam, role: roleParam, verify: verifyParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const loginRole = roleParam === "artist" ? "artist" : "collector";
  /** Collector default after Google/email login: home (not vault collection). */
  const fallbackReturnTo =
    loginRole === "artist" ? withLocale(locale, "/vault/submit") : withLocale(locale, "/");
  const returnTo = sanitizeReturnTo(returnToParam, fallbackReturnTo);

  const collectorLoginHref = `${withLocale(locale, "/login")}?${new URLSearchParams({
    role: "collector",
    returnTo,
  }).toString()}`;
  const artistLoginHref = `${withLocale(locale, "/login")}?${new URLSearchParams({
    role: "artist",
    returnTo,
  }).toString()}`;
  const signupHref =
    loginRole === "artist"
      ? `${withLocale(locale, "/artist-signup")}?returnTo=${encodeURIComponent(returnTo)}`
      : `${withLocale(locale, "/signup")}?returnTo=${encodeURIComponent(returnTo)}`;
  const signupLabel = loginRole === "artist" ? m.artistSignup.title : m.signup.title;
  const sso = storefrontSsoConfigured();
  const verifyBanner =
    verifyParam === "ok" || verifyParam === "invalid" || verifyParam === "expired" ? verifyParam : null;

  return (
    <main className="min-h-screen bg-opus-charcoal px-6 pb-24 pt-[calc(var(--opus-header-plus-trust)+4rem)] text-opus-warm/80">
      <div className="mx-auto max-w-md">
        <p className="opus-text-metallic-soft text-center text-xs uppercase tracking-[0.4em]">OPUS</p>
        <h1 className="mt-4 text-center font-display text-3xl tracking-[0.12em] text-opus-warm">
          {m.auth.title}
        </h1>
        <p className="mt-3 text-center text-sm text-opus-warm/55">{m.auth.subtitle}</p>
        {verifyBanner === "ok" ? (
          <p className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200/90">
            {m.auth.verifyEmailOkBanner}
          </p>
        ) : null}
        {verifyBanner === "invalid" ? (
          <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200/90">
            {m.auth.verifyEmailInvalidBanner}
          </p>
        ) : null}
        {verifyBanner === "expired" ? (
          <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/90">
            {m.auth.verifyEmailExpiredBanner}
          </p>
        ) : null}
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-opus-slate/25 p-2">
          <p className="px-2 pb-2 text-[0.7rem] text-opus-warm/45">{m.auth.roleLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={collectorLoginHref}
              className={`rounded-lg px-3 py-2 text-center text-sm transition ${
                loginRole === "collector"
                  ? "bg-opus-gold/15 text-opus-gold"
                  : "text-opus-warm/65 hover:bg-white/[0.04] hover:text-opus-warm"
              }`}
            >
              {m.auth.roleCollector}
            </Link>
            <Link
              href={artistLoginHref}
              className={`rounded-lg px-3 py-2 text-center text-sm transition ${
                loginRole === "artist"
                  ? "bg-opus-gold/15 text-opus-gold"
                  : "text-opus-warm/65 hover:bg-white/[0.04] hover:text-opus-warm"
              }`}
            >
              {m.auth.roleArtist}
            </Link>
          </div>
        </div>

        <UnifiedAuthSection
          variant="login"
          locale={locale}
          returnTo={returnTo}
          sso={sso}
          termsHref={withLocale(locale, "/terms")}
          privacyHref={withLocale(locale, "/privacy")}
          termsLabel={m.footer.terms}
          privacyLabel={m.footer.privacy}
          m={m}
        />

        <p className="mt-6 rounded-xl border border-opus-gold/15 bg-opus-slate/30 px-5 py-4 text-xs leading-relaxed text-opus-warm/55">
          {m.auth.note}
        </p>

        <div className="mt-10 text-center text-sm text-opus-warm/55">
          <Link
            href={signupHref}
            className="text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {signupLabel}
          </Link>
        </div>

        <div className="mt-10 text-center">
          <Link
            href={withLocale(locale, "/")}
            className="text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
