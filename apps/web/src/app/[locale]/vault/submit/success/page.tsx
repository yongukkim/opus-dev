import Link from "next/link";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { VaultArtistGate } from "@/components/vault/VaultArtistGate";
import { VaultArtistKycGate } from "@/components/vault/VaultArtistKycGate";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import { getArtistKycFromCookies } from "@/lib/artistKyc";
import { cookies } from "next/headers";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ artist?: string; name?: string }>;
};

export default async function VaultSubmitSuccessPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { artist: artistParam, name: nameParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);

  const cookieStore = await cookies();
  const vaultRole = getVaultUiRoleFromCookies(cookieStore);
  if (vaultRole !== "artist") {
    return <VaultArtistGate variant="submit" locale={locale} vault={m.vault} currentRole={vaultRole} />;
  }

  const kyc = getArtistKycFromCookies(cookieStore);
  if (kyc !== "verified") {
    return <VaultArtistKycGate locale={locale} m={m} returnTo={withLocale(locale, "/vault/submit")} />;
  }

  const artist = artistParam?.trim() ?? "";
  const name = nameParam?.trim() ?? "";
  const myArtworksBase = withLocale(locale, "/vault/my-artworks");
  const q = new URLSearchParams();
  if (artist) q.set("artist", artist);
  if (name) q.set("name", name);
  const myArtworksHref = q.toString() ? `${myArtworksBase}?${q.toString()}` : myArtworksBase;

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      <div className="mx-auto max-w-3xl">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">
          {m.submitSuccess.kicker}
        </p>
        <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{m.submitSuccess.title}</h1>
        <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{m.submitSuccess.body}</p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href={myArtworksHref}
            className="opus-surface-metallic inline-flex w-fit items-center justify-center rounded-full px-8 py-3 text-sm font-medium text-black transition hover:opacity-95"
          >
            {m.submitSuccess.toMyArtworks}
          </Link>
          <Link
            href={withLocale(locale, "/vault")}
            className="text-sm text-opus-gold/70 underline-offset-4 transition hover:text-opus-gold hover:underline"
          >
            {m.submitSuccess.toVault}
          </Link>
        </div>
      </div>
    </main>
  );
}

