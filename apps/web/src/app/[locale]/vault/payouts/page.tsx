import { VaultArtistGate } from "@/components/vault/VaultArtistGate";
import { VaultArtistKycGate } from "@/components/vault/VaultArtistKycGate";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { getArtistKycFromCookies } from "@/lib/artistKyc";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import { cookies } from "next/headers";
import { ArtistPayoutsForm } from "@/components/artist/ArtistPayoutsForm";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultPayoutsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const cookieStore = await cookies();
  const vaultRole = getVaultUiRoleFromCookies(cookieStore);
  if (vaultRole !== "artist") {
    return <VaultArtistGate variant="payouts" locale={locale} vault={m.vault} currentRole={vaultRole} />;
  }

  const kyc = getArtistKycFromCookies(cookieStore);
  if (kyc !== "verified") {
    return <VaultArtistKycGate locale={locale} m={m} returnTo={withLocale(locale, "/vault/payouts")} />;
  }

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      <div className="mx-auto max-w-3xl">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">Vault</p>
        <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{m.payouts.title}</h1>
        <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{m.payouts.subtitle}</p>

        <div className="mt-10">
          <ArtistPayoutsForm m={m} />
        </div>
      </div>
    </main>
  );
}

