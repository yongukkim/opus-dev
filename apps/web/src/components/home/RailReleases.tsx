import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/types";
import { withLocale } from "@/i18n/paths";
import { auth } from "@/auth";
import { listApprovedPrimaryReleasesForRail } from "@/lib/primaryReleasesForRail";

/**
 * Rail A · Releases — PR-5 of the home redesign series.
 * Spec: docs/home-redesign-curation-rails-and-omnisearch.md §3.3 / §6.
 *
 * Replaces the legacy `ArchivePreviewGrid` (deleted in this PR per §7.2 /
 * §7.3). The visible card shape is intentionally near-identical so the home
 * IA does not visually shift; the substantive change is _link target_:
 *
 *   before — every card linked to the same `/releases` listing page
 *   after  — each card links to `/releases/[encodeArtworkSlug(file)]`
 *
 * That single change resolves the spec's "현재 8개 카드가 모두 목록으로
 * 가는 문제" — the PRIMARY (1차) channel finally has per-artwork discovery
 * from the home page.
 *
 * The PRIMARY pill in the top-right mirrors the SECONDARY pill on Rail B
 * (PR-4); together they make spec §3.4's channel separation visible at a
 * glance — same component contract from `m.badge.*` (ISO 27001 A.5.1.1).
 *
 * Data source: `listApprovedPrimaryReleasesForRail()` — operator-approved
 * submissions still held as the registering artist’s studio inventory, and
 * not tied to an open custody-transfer listing (those appear under Provenance).
 * Thumbnails use `/api/artwork-submissions/[id]/public-preview` (watermarked).
 */
const HOME_RAIL_LIMIT = 8;

export async function RailReleases({
  locale,
  m,
}: {
  locale: Locale;
  m: Messages;
}) {
  const r = m.home.railReleases;
  const session = await auth();
  const sessionUserId = session?.user?.id?.trim() ?? "";
  const approved = await listApprovedPrimaryReleasesForRail(HOME_RAIL_LIMIT);
  const items = approved.map((rec) => ({
    key: rec.id,
    href:
      sessionUserId && rec.artistId === sessionUserId
        ? withLocale(locale, "/vault/my-artworks")
        : withLocale(locale, `/releases/submission/${rec.id}`),
    title: rec.artworkTitle,
    artist: rec.nickname || rec.artistName,
    meta: `Edition 1 / ${rec.editionTotal}`,
    imageSrc: `/api/artwork-submissions/${rec.id}/public-preview`,
  }));

  return (
    <section
      className="border-t border-white/[0.05] py-16 md:py-20"
      aria-labelledby="opus-rail-releases-heading"
      aria-label={r.title}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2
              id="opus-rail-releases-heading"
              className="opus-text-metallic font-display text-2xl tracking-wide md:text-3xl"
            >
              {r.title}
            </h2>
            <p className="mt-3 max-w-lg font-sans text-sm text-opus-warm/55">
              {r.body}
            </p>
          </div>
          <Link
            href={withLocale(locale, "/releases")}
            className="shrink-0 border border-opus-gold/42 px-5 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-opus-gold transition hover:border-opus-gold-light/55 hover:bg-opus-gold/10"
          >
            {r.viewAll}
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 max-w-lg text-sm leading-relaxed text-opus-warm/50">{r.empty}</p>
        ) : (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group block overflow-hidden rounded-lg border border-white/[0.08] bg-opus-slate/30 shadow-opus-card transition hover:border-opus-gold/38"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#1f1f1f] to-opus-charcoal">
                    <Image
                      src={item.imageSrc}
                      alt={`${item.title} — ${item.artist}`}
                      fill
                      sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw"
                      unoptimized
                      className="object-cover opacity-95 transition duration-700 group-hover:scale-[1.02] group-hover:opacity-100"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(222,184,146,0.18),transparent_60%)] opacity-70" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                    {/*
                    PRIMARY pill — sourced from m.badge.primary so the ⌘K
                    omni-search results in PR-8 reuse the exact same label.
                  */}
                    <span className="absolute right-3 top-3 rounded-full border border-opus-gold/45 bg-black/55 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-opus-gold-light backdrop-blur-sm">
                      {m.badge.primary}
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06] px-4 py-4">
                    <p className="opus-text-metallic line-clamp-1 font-display text-sm tracking-wide">
                      {item.title}
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] text-opus-warm/45">{item.meta}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
