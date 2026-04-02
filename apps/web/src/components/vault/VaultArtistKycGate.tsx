import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";

export function VaultArtistKycGate({
  locale,
  m,
  returnTo,
}: {
  locale: Locale;
  m: Messages;
  returnTo: string;
}) {
  const v = m.vault;
  const k = m.artistKyc;
  const href = `${withLocale(locale, "/artist/kyc/consent")}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="p-6 md:p-10">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">Vault</p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{k.consentTitle}</h1>
      <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{v.artistKycGateBody}</p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href={href}
          className="opus-surface-metallic inline-flex w-fit items-center justify-center rounded-full px-8 py-3 text-sm font-medium text-black transition hover:opacity-95"
        >
          {v.artistKycGateCta}
        </Link>
        <Link
          href={withLocale(locale, "/vault")}
          className="text-sm text-opus-gold/70 underline-offset-4 transition hover:text-opus-gold hover:underline"
        >
          {v.artistGateBackVault}
        </Link>
      </div>
    </main>
  );
}

