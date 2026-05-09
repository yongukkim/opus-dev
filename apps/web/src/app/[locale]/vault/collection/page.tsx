import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n/catalog";
import type { Messages } from "@/i18n/types";
import { normalizeLocale, withLocale } from "@/i18n/paths";
import {
  listSubmissionsHeldByUser,
  type OwnershipState,
  type SubmissionRecord,
} from "@/lib/privateStorage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

function transferGenreLabel(ct: Messages["collectorTransfer"], key: string): string {
  const map: Record<string, string> = {
    "digital-painting": ct.genreOptDigitalPainting,
    illustration: ct.genreOptIllustration,
    photography: ct.genreOptPhotography,
    "3d": ct.genreOpt3d,
    generative: ct.genreOptGenerative,
    video: ct.genreOptVideo,
    "mixed-media": ct.genreOptMixedMedia,
    other: ct.genreOptOther,
  };
  return map[key] || key || "—";
}

/** Collection chip: only “approved” vs “not released yet” (검수 대기). */
function reviewStatusLabel(m: Messages["vault"], rec: SubmissionRecord): string {
  if ((rec.reviewStatus ?? "pending_review") === "approved") return m.collectionStatusApproved;
  return m.collectionStatusPending;
}

function editionLine(rec: SubmissionRecord): string {
  return rec.editionMode === "unique" ? "Edition 1/1" : `Edition ${rec.initialMint}/${rec.editionTotal}`;
}

function heldBadge(m: Messages["vault"], owner: OwnershipState): string {
  return owner.ownerType === "artist" ? m.collectionHeldBadgeArtist : m.collectionHeldBadgeCollector;
}

export default async function VaultCollectionPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw);
  const m = getDictionary(locale);
  const v = m.vault;
  const ct = m.collectorTransfer;

  const session = await auth();
  if (!session?.user?.id) {
    const returnTo = encodeURIComponent(withLocale(locale, "/vault/collection"));
    redirect(`${withLocale(locale, "/login")}?returnTo=${returnTo}`);
  }

  const held = await listSubmissionsHeldByUser(session.user.id);
  const sessionUserId = session.user.id;

  return (
    <main className="p-6 md:p-10">
      <h1 className="font-display text-2xl text-opus-warm md:text-3xl">{v.collectionTitle}</h1>
      <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-opus-warm/55">{v.collectionBody}</p>

      {held.length === 0 ? (
        <p className="mt-12 max-w-xl text-sm text-opus-warm/50">{v.collectionEmpty}</p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {held.map(({ submission: rec, owner }) => {
            const approved = (rec.reviewStatus ?? "pending_review") === "approved";
            const isOwnArtistRegistration = rec.artistId === sessionUserId;
            const pen = rec.nickname?.trim() || rec.artistName?.trim() || "—";
            const yearLabel = rec.year != null && Number.isFinite(rec.year) ? String(rec.year) : null;
            const tags = Array.isArray(rec.tags) ? rec.tags.map((x) => x.trim()).filter(Boolean).slice(0, 6) : [];
            const transferHref = withLocale(
              locale,
              `/vault/transfer/register?submissionId=${encodeURIComponent(rec.id)}`,
            );
            return (
              <li
                key={rec.id}
                className="overflow-hidden rounded-xl border border-white/[0.08] bg-opus-slate/20 shadow-opus-card"
              >
                <div className="md:flex">
                  <div className="relative aspect-[4/3] bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal md:aspect-auto md:min-h-full md:w-[46%] md:max-w-[18rem]">
                    {approved ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic same-origin API WebP; avoids next/image quirks with /api paths */}
                        <img
                          src={`/api/artwork-submissions/${encodeURIComponent(rec.id)}/public-preview`}
                          alt={rec.artworkTitle}
                          sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw"
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover opacity-95"
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(222,184,146,0.12),transparent_55%)]" />
                    )}
                    <span className="absolute left-3 top-3 rounded-full border border-white/[0.12] bg-black/45 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-opus-warm/75 backdrop-blur-sm">
                      {heldBadge(v, owner)}
                    </span>
                    <span
                      className={`absolute right-3 top-3 rounded-full border px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] backdrop-blur-sm ${
                        approved
                          ? "border-opus-gold/40 bg-black/50 text-opus-gold-light"
                          : "border-white/[0.12] bg-black/45 text-opus-warm/60"
                      }`}
                    >
                      {reviewStatusLabel(v, rec)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <p className="opus-text-metallic line-clamp-2 font-display text-base tracking-wide text-opus-warm">
                        {rec.artworkTitle}
                      </p>
                      <p className="mt-1 text-xs text-opus-warm/55">{pen}</p>
                      <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">
                        {transferGenreLabel(ct, rec.genre)} · {editionLine(rec)}
                        {yearLabel ? ` · ${yearLabel}` : ""}
                      </p>
                    </div>
                    {rec.description?.trim() ? (
                      <p className="line-clamp-3 text-xs leading-relaxed text-opus-warm/55">{rec.description.trim()}</p>
                    ) : null}
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded border border-white/[0.08] bg-black/15 px-2 py-0.5 text-[0.65rem] text-opus-warm/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {approved && rec.initialMint > 0 ? (
                      <div className="border-t border-white/[0.06] pt-3">
                        <p className="text-[0.65rem] leading-relaxed text-opus-warm/45">{v.collectionCertificateLead}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Array.from({ length: rec.initialMint }, (_, i) => i + 1).map((n) => (
                            <a
                              key={n}
                              href={`/api/edition-certificates/${encodeURIComponent(rec.id)}/${n}`}
                              download
                              className="inline-flex rounded border border-opus-gold/25 bg-opus-gold/5 px-2 py-1 font-mono text-[0.6rem] text-opus-gold-light transition hover:border-opus-gold/40 hover:bg-opus-gold/10"
                            >
                              {v.collectionCertificateEditionJson.replace("{n}", String(n))}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  <div className="mt-auto flex flex-col gap-2 pt-1">
                    {approved ? (
                      <>
                        {isOwnArtistRegistration ? (
                          <Link
                            href={withLocale(locale, "/vault/my-artworks")}
                            className="inline-flex w-full items-center justify-center rounded-md border border-opus-gold/30 bg-opus-gold/10 px-3 py-2 text-center text-xs font-semibold text-opus-gold-light transition hover:border-opus-gold/50 hover:bg-opus-gold/[0.14]"
                          >
                            {m.vaultNav.myArtworks}
                          </Link>
                        ) : (
                          <Link
                            href={transferHref}
                            className="opus-surface-metallic inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-center text-xs font-semibold text-opus-charcoal transition hover:opacity-95"
                          >
                            {v.collectionTransferCta}
                          </Link>
                        )}
                        <Link
                          href={withLocale(locale, `/viewer/immersive/${rec.id}`)}
                          className="inline-flex w-full items-center justify-center rounded-md border border-white/[0.1] bg-black/20 px-3 py-2 text-center text-xs font-medium text-opus-warm/80 transition hover:border-opus-gold/25 hover:bg-black/30"
                        >
                          {v.collectionImmersiveCta}
                        </Link>
                      </>
                    ) : (
                      <p className="rounded-md border border-white/[0.06] bg-black/15 px-3 py-2 text-center text-[0.7rem] leading-relaxed text-opus-warm/45">
                        {v.collectionNotApprovedHint}
                      </p>
                    )}
                  </div>
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
