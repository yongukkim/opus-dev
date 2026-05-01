import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import type { VaultUiRole } from "@/lib/vaultRole";
import { VaultRoleDemoSwitch } from "./VaultRoleDemoSwitch";

export type VaultArtistGateReason = "notRegisteredArtist" | "needArtistUiMode";

export function VaultArtistGate({
  variant,
  locale,
  vault,
  currentRole,
  gateReason,
}: {
  variant: "submit" | "myArtworks" | "payouts" | "artistProfile";
  locale: Locale;
  vault: Messages["vault"];
  currentRole: VaultUiRole;
  gateReason: VaultArtistGateReason;
}) {
  const needUiMode = gateReason === "needArtistUiMode";

  const bodyNotRegistered =
    variant === "submit"
      ? vault.artistGateSubmitBody
      : variant === "myArtworks"
        ? vault.artistGateMyArtworksBody
        : variant === "payouts"
          ? vault.artistGatePayoutsBody
          : vault.artistGateProfileBody;

  const title = needUiMode ? vault.artistUiModeGateTitle : vault.artistGateTitle;
  const body = needUiMode ? vault.artistUiModeGateBody : bodyNotRegistered;

  return (
    <main className="p-6 md:p-10">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">
        {vault.overviewKicker}
      </p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{title}</h1>
      <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{body}</p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        {!needUiMode ? (
          <Link
            href={withLocale(locale, "/artist-signup")}
            className="opus-surface-metallic inline-flex w-fit items-center justify-center rounded-full px-8 py-3 text-sm font-medium text-black transition hover:opacity-95"
          >
            {vault.artistGateSignupCta}
          </Link>
        ) : null}
        <Link
          href={withLocale(locale, "/vault/collection")}
          className="text-sm text-opus-gold/70 underline-offset-4 transition hover:text-opus-gold hover:underline"
        >
          {vault.artistGateBackVault}
        </Link>
      </div>
      {needUiMode ? (
        <VaultRoleDemoSwitch
          currentRole={currentRole}
          sectionTitle={vault.vaultModeSwitchTitle}
          labels={{ toArtist: vault.demoSwitchArtist, toCollector: vault.demoSwitchCollector }}
        />
      ) : null}
    </main>
  );
}
