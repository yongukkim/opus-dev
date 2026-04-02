import { VaultArtistGate } from "@/components/vault/VaultArtistGate";
import { getDictionary } from "@/i18n/catalog";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import {
  OPUS_ARTIST_NICKNAME_COOKIE,
  decodeArtistNicknameFromCookie,
} from "@/lib/artistSignupProfile";
import { listArtistSubmissions } from "@/lib/privateStorage";
import { getVaultUiRoleFromCookies } from "@/lib/vaultRole";
import { cookies } from "next/headers";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ artist?: string; name?: string; page?: string }>;
};

const PAGE_SIZE = 20;

function parsePage(value: string | undefined): number {
  if (value == null || value === "") return 1;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function myArtworksHref(
  locale: ReturnType<typeof normalizeLocale>,
  artistId: string,
  displayName: string | undefined,
  page: number,
): string {
  const base = withLocale(locale, "/vault/my-artworks");
  const q = new URLSearchParams();
  q.set("artist", artistId);
  if (displayName?.trim()) q.set("name", displayName.trim());
  if (page > 1) q.set("page", String(page));
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function VaultMyArtworksPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { artist: artistParam, name: nameParam, page: pageParam } = await searchParams;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const aa = m.artistArtworks;
  const a = m.artworks;

  const cookieStore = await cookies();
  const vaultRole = getVaultUiRoleFromCookies(cookieStore);
  if (vaultRole !== "artist") {
    return (
      <VaultArtistGate
        variant="myArtworks"
        locale={locale}
        vault={m.vault}
        currentRole={vaultRole}
      />
    );
  }

  const artistId = artistParam?.trim() ?? "";
  const displayNameFromQuery = nameParam?.trim() ?? "";
  const signupNickname = decodeArtistNicknameFromCookie(
    cookieStore.get(OPUS_ARTIST_NICKNAME_COOKIE)?.value,
  );

  const submissions = artistId ? await listArtistSubmissions(artistId) : [];
  const displayName =
    signupNickname ||
    displayNameFromQuery ||
    submissions[0]?.nickname ||
    submissions[0]?.artistName ||
    artistId ||
    "—";

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const requestedPage = parsePage(pageParam);
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageItems = submissions.slice(offset, offset + PAGE_SIZE);

  const pageOfLabel = a.paginationPageOf
    .replace("{current}", String(currentPage))
    .replace("{total}", String(totalPages));

  return (
    <main className="flex-1 p-6 pb-24 text-opus-warm/80 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="opus-text-metallic-soft text-sm uppercase tracking-[0.35em]">{displayName}</p>
          <h1 className="mt-4 font-display text-2xl text-opus-warm md:text-3xl">{aa.title}</h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-sm text-opus-warm/60">{aa.body}</p>
          {!artistId ? (
            <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-opus-warm/45">{aa.devHint}</p>
          ) : submissions.length === 0 ? (
            <p className="mx-auto mt-3 max-w-lg text-sm text-opus-warm/50">{aa.empty}</p>
          ) : null}
        </div>

        {artistId && pageItems.length > 0 ? (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {pageItems.map((rec) => {
              const previewSrc = `/api/artwork-submissions/${rec.id}/preview?artistId=${encodeURIComponent(artistId)}`;
              const edition = `${a.editionLabel} 1/${rec.editionTotal}`;
              const isVideo = rec.storedFile.mime.startsWith("video/");
              const reviewStatus = rec.reviewStatus ?? "pending_review";
              const statusLabel =
                reviewStatus === "approved"
                  ? m.operatorReview.filterApproved
                  : reviewStatus === "changes_requested"
                    ? m.operatorReview.filterChanges
                    : reviewStatus === "rejected"
                      ? m.operatorReview.filterRejected
                      : m.operatorReview.filterPending;
              return (
                <li key={rec.id}>
                  <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card">
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                      {isVideo ? (
                        <video
                          src={previewSrc}
                          className="h-full w-full object-cover opacity-95"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- API preview; avoids image remotePatterns config
                        <img
                          src={previewSrc}
                          alt={`${rec.artworkTitle} — ${rec.nickname}`}
                          className="h-full w-full object-cover opacity-95"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                    </div>
                    <div className="border-t border-white/[0.06] px-4 py-4">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                        <span className="opus-text-metallic font-display text-sm tracking-wide">{rec.artworkTitle}</span>
                        <span className="font-display text-sm tracking-wide text-opus-warm/55">{rec.nickname}</span>
                      </p>
                      <p className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[0.65rem] text-opus-warm/45">{edition}</span>
                        <span className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 font-mono text-[0.65rem] text-opus-warm/60">
                          {statusLabel}
                        </span>
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {artistId && totalPages > 1 ? (
          <nav
            className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.06] pt-10"
            aria-label={pageOfLabel}
          >
            {currentPage > 1 ? (
              <Link
                href={myArtworksHref(locale, artistId, displayNameFromQuery || undefined, currentPage - 1)}
                rel="prev"
                className="rounded border border-white/[0.12] px-4 py-2 text-sm text-opus-warm/85 transition hover:border-opus-gold/40 hover:text-opus-gold-light"
              >
                {a.paginationPrev}
              </Link>
            ) : (
              <span className="rounded border border-transparent px-4 py-2 text-sm text-opus-warm/25">
                {a.paginationPrev}
              </span>
            )}
            <span className="font-mono text-sm text-opus-warm/55">{pageOfLabel}</span>
            {currentPage < totalPages ? (
              <Link
                href={myArtworksHref(locale, artistId, displayNameFromQuery || undefined, currentPage + 1)}
                rel="next"
                className="rounded border border-white/[0.12] px-4 py-2 text-sm text-opus-warm/85 transition hover:border-opus-gold/40 hover:text-opus-gold-light"
              >
                {a.paginationNext}
              </Link>
            ) : (
              <span className="rounded border border-transparent px-4 py-2 text-sm text-opus-warm/25">
                {a.paginationNext}
              </span>
            )}
          </nav>
        ) : null}

        <div className="mt-14 flex flex-wrap justify-center gap-6 text-center">
          <Link
            href={withLocale(locale, "/vault")}
            className="inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {aa.backVault}
          </Link>
          <Link
            href={withLocale(locale, "/")}
            className="inline-block text-sm text-opus-gold underline-offset-4 hover:text-opus-gold-light hover:underline"
          >
            {aa.backHome}
          </Link>
          <Link
            href={withLocale(locale, "/artworks")}
            className="inline-block text-sm text-opus-warm/55 underline-offset-4 hover:text-opus-gold hover:underline"
          >
            {m.footer.archive}
          </Link>
        </div>
      </div>
    </main>
  );
}
