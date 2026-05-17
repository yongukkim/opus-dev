import { ArtworkSubmissionForm } from "@/components/artist/ArtworkSubmissionForm";
import { ArtistSubmissionGuideModal } from "@/components/artist/ArtistSubmissionGuideModal";
import { VaultArtistGate } from "@/components/vault/VaultArtistGate";
import { VaultArtistKycGate } from "@/components/vault/VaultArtistKycGate";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import { getArtistKycFromCookies } from "@/lib/artistKyc";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function VaultSubmitArtworkPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const cookieStore = await cookies();
  const session = await auth();
  const cookieRole = getVaultUiRoleFromCookies(cookieStore);

  if (session?.user?.role !== "artist") {
    return (
      <VaultArtistGate
        variant="submit"
        gateReason="notRegisteredArtist"
        locale={locale}
        vault={m.vault}
        currentRole={cookieRole}
      />
    );
  }

  if (cookieRole !== "artist") {
    return (
      <VaultArtistGate
        variant="submit"
        gateReason="needArtistUiMode"
        locale={locale}
        vault={m.vault}
        currentRole={cookieRole}
      />
    );
  }

  const kyc = getArtistKycFromCookies(cookieStore);
  if (kyc !== "verified") {
    return <VaultArtistKycGate locale={locale} m={m} returnTo={`/${locale}/vault/submit`} />;
  }

  const s = m.submitArtwork;
  const artistPenName = session.user.name?.trim() ?? "";
  const myArtworksHref = session.user.id
    ? `${withLocale(locale, "/vault/my-artworks")}?artist=${encodeURIComponent(session.user.id)}`
    : withLocale(locale, "/vault/my-artworks");

  if (!artistPenName) {
    return (
      <main className="p-6 md:p-10">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{s.kicker}</p>
        <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{s.penNameRequiredTitle}</h1>
        <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/60">{s.penNameRequiredBody}</p>
        <p className="mt-8">
          <Link
            href={`/${locale}/vault/artist-profile`}
            className="opus-surface-metallic inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold text-opus-charcoal transition hover:opacity-95"
          >
            {s.penNameRequiredCta}
          </Link>
        </p>
      </main>
    );
  }

  const guideRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { artistSubmissionGuideCompletedAt: true },
  });

  if (!guideRow?.artistSubmissionGuideCompletedAt) {
    return (
      <main className="relative min-h-[60vh] p-6 md:p-10">
        <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{s.kicker}</p>
        <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{s.title}</h1>
        <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{s.subtitle}</p>
        <ArtistSubmissionGuideModal g={m.artistSubmissionGuide} />
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10">
      <p className="opus-text-metallic-soft font-mono text-[0.65rem] uppercase tracking-[0.28em]">{s.kicker}</p>
      <h1 className="mt-3 font-display text-2xl text-opus-warm md:text-3xl">{s.title}</h1>
      <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{s.subtitle}</p>

      <div className="mt-6 max-w-2xl rounded-xl border border-opus-gold/20 bg-opus-gold/[0.05] px-4 py-3 text-sm leading-relaxed text-opus-warm/75">
        <p>{s.withdrawWhilePendingHint}</p>
        <p className="mt-2">
          <Link
            href={myArtworksHref}
            className="font-medium text-opus-gold/90 underline-offset-4 transition hover:text-opus-gold-light hover:underline"
          >
            {m.vaultNav.myArtworks} →
          </Link>
        </p>
      </div>

      <div className="mt-10">
        <ArtworkSubmissionForm
          locale={locale}
          m={m}
          artistLegalName={session.user.name?.trim() ?? ""}
          artistPenName={artistPenName}
          sessionUserId={session.user.id}
        />
      </div>
    </main>
  );
}

