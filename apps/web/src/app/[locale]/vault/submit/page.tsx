import { ArtworkSubmissionForm } from "@/components/artist/ArtworkSubmissionForm";
import { VaultArtistGate } from "@/components/vault/VaultArtistGate";
import { VaultArtistKycGate } from "@/components/vault/VaultArtistKycGate";
import { getDictionary } from "@/i18n/catalog";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import { getArtistKycFromCookies } from "@/lib/artistKyc";
import { normalizeLocale } from "@/i18n/paths";
import { cookies } from "next/headers";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultSubmitArtworkPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const cookieStore = await cookies();
  const vaultRole = getVaultUiRoleFromCookies(cookieStore);

  if (vaultRole !== "artist") {
    return (
      <VaultArtistGate variant="submit" locale={locale} vault={m.vault} currentRole={vaultRole} />
    );
  }

  const kyc = getArtistKycFromCookies(cookieStore);
  if (kyc !== "verified") {
    return <VaultArtistKycGate locale={locale} m={m} returnTo={`/${locale}/vault/submit`} />;
  }

  const s = m.submitArtwork;

  return (
    <main className="p-6 md:p-10">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{s.kicker}</p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{s.title}</h1>
      <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{s.subtitle}</p>

      <div className="mt-10">
        <ArtworkSubmissionForm locale={locale} m={m} />
      </div>
    </main>
  );
}

