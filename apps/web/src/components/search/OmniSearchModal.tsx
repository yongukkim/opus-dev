"use client";

import { Command } from "cmdk";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import type { Messages } from "@/i18n/types";
import type {
  SearchArtist,
  SearchArtwork,
  SearchListing,
  SearchShelf,
} from "@/lib/searchIndex.types";
import { useOmniSearch } from "./OmniSearchProvider";

/**
 * ⌘K omni-search modal (PR-8 / spec §4.2 / §4.4 / §4.5).
 *
 * Behavior:
 *   - Opens from the OmniSearchProvider (⌘K, Ctrl+K, `/`, or trigger click).
 *   - `cmdk` owns roving focus + selection. We disable its built-in filter
 *     (`shouldFilter={false}`) and run our own substring + token match so
 *     a multi-word query (e.g. "matsu 14") matches any field combination.
 *   - The modal is portal-like overlay rendered into the layout tree;
 *     it is `aria-modal` and traps focus via cmdk + the overlay click.
 *
 * Implementation note (lint compliance): we mount a fresh
 * `OmniSearchModalInner` on each open via the `isOpen` gate in the outer
 * component, so all transient state (query, scope) initializes via
 * `useState(...)` — no `setState` inside an effect.
 *
 * Compliance (spec §4.4 / .cursorrules §2 / ISO 27001 A.18.1.4):
 *   - The visible artist label is always `artistPenName` (filename or
 *     submission-derived). No legal name reaches this view.
 *   - Listing rows show `sellerMasked` (already passed through
 *     `maskSellerId` at index build time). The raw seller id never
 *     reaches the client.
 *   - Prices format with the JPY locale (`ja-JP`); the renderer never
 *     introduces investment / yield language.
 */

type Scope = "all" | "artwork" | "artist" | "listing" | "shelf";
const PER_GROUP_LIMIT = 8;

const jpyFormatter = new Intl.NumberFormat("ja-JP");

function formatJpy(n: number): string {
  return `¥${jpyFormatter.format(n)}`;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function matches(haystack: string, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;
  const lower = haystack.toLowerCase();
  for (const t of tokens) if (!lower.includes(t)) return false;
  return true;
}

type ModalProps = {
  locale: Locale;
  t: Messages["search"];
  badge: Messages["badge"];
};

export function OmniSearchModal(props: ModalProps) {
  const { isOpen } = useOmniSearch();
  // Gate at the outer component so a fresh `OmniSearchModalInner` mounts
  // each time the modal opens — keeps query/scope initialization in
  // `useState` and out of effects.
  if (!isOpen) return null;
  return <OmniSearchModalInner {...props} />;
}

function OmniSearchModalInner({ locale, t, badge }: ModalProps) {
  const { close, index, loadStatus } = useOmniSearch();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Body scroll lock + initial focus on mount (single-shot, no setState).
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const tokens = useMemo(() => tokenize(query), [query]);

  const filtered = useMemo(() => {
    const empty = {
      artworks: [] as SearchArtwork[],
      artists: [] as SearchArtist[],
      listings: [] as SearchListing[],
      shelves: [] as SearchShelf[],
    };
    if (!index) return empty;
    const wantArtworks = scope === "all" || scope === "artwork";
    const wantArtists = scope === "all" || scope === "artist";
    const wantListings = scope === "all" || scope === "listing";
    const wantShelves = scope === "all" || scope === "shelf";

    const artworks = wantArtworks
      ? index.artworks.filter((a) =>
          matches(`${a.title} ${a.artistPenName} ${a.slug}`, tokens),
        )
      : [];
    const artists = wantArtists
      ? index.artists.filter((a) => matches(a.penName, tokens))
      : [];
    const listings = wantListings
      ? index.listings.filter((l) =>
          matches(`${l.artworkTitle} ${l.artistPenName}`, tokens),
        )
      : [];
    // Shelves search the active-locale title + description (plus id so a
    // query like "highlights" still lands on an id-shaped shelf).
    const shelves = wantShelves
      ? (index.shelves ?? []).filter((s) =>
          matches(
            `${s.title[locale]} ${s.description[locale]} ${s.id}`,
            tokens,
          ),
        )
      : [];

    return { artworks, artists, listings, shelves };
  }, [index, scope, tokens, locale]);

  const totalCount =
    filtered.artworks.length +
    filtered.artists.length +
    filtered.listings.length +
    filtered.shelves.length;

  const navigateAndClose = (href: string) => {
    router.push(withLocale(locale, href));
    close();
  };

  const scopes: Array<{ id: Scope; label: string }> = [
    { id: "all", label: t.scopeAll },
    { id: "artwork", label: t.scopeArtwork },
    { id: "artist", label: t.scopeArtist },
    { id: "shelf", label: t.scopeShelf },
    { id: "listing", label: t.scopeListing },
  ];

  const isLoading = loadStatus === "loading" || (loadStatus === "idle" && !index);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/72 px-4 pt-[12vh] backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <Command
        label={t.modalTitle}
        shouldFilter={false}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-white/[0.1] bg-opus-charcoal/95 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
          <span aria-hidden className="text-opus-warm/55">
            🔍
          </span>
          <Command.Input
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            placeholder={t.placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-opus-warm placeholder:text-opus-warm/35 focus:outline-none"
          />
          <button
            type="button"
            onClick={close}
            aria-label={t.hintClose}
            className="rounded border border-white/[0.1] px-2.5 py-0.5 font-sans text-[0.65rem] text-opus-warm/65 hover:text-opus-gold-light"
          >
            {t.hintClose}
          </button>
        </div>

        <div
          role="tablist"
          aria-label={t.scopeAria}
          className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-3 py-2"
        >
          {scopes.map((s) => {
            const active = scope === s.id;
            return (
              <button
                key={s.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setScope(s.id)}
                className={`rounded-full px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] transition ${
                  active
                    ? "border border-opus-gold/45 bg-opus-gold/10 text-opus-gold-light"
                    : "border border-white/[0.1] text-opus-warm/60 hover:text-opus-warm/85"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <Command.List className="max-h-[55vh] overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="px-3 py-6 text-center text-xs text-opus-warm/55">
              {t.loading}
            </div>
          ) : totalCount === 0 ? (
            <Command.Empty className="px-3 py-6 text-center text-sm text-opus-warm/55">
              <p>{t.empty}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={withLocale(locale, "/releases")}
                  onClick={close}
                  className="rounded-full border border-opus-gold/40 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-gold-light hover:bg-opus-gold/10"
                >
                  {t.viewAllReleases}
                </Link>
                <Link
                  href={withLocale(locale, "/provenance")}
                  onClick={close}
                  className="rounded-full border border-white/[0.12] px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/65 hover:border-opus-gold/40 hover:text-opus-gold-light"
                >
                  {t.viewAllProvenance}
                </Link>
              </div>
            </Command.Empty>
          ) : (
            <>
              {filtered.artworks.length > 0 && (
                <Command.Group heading={t.groupArtworks} className="px-1 py-2">
                  {filtered.artworks.slice(0, PER_GROUP_LIMIT).map((a) => (
                    <Command.Item
                      key={`aw-${a.slug}`}
                      value={`aw-${a.slug}`}
                      onSelect={() => navigateAndClose(a.href)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded px-3 py-2 text-sm text-opus-warm/85 aria-selected:bg-white/[0.05] aria-selected:text-opus-warm"
                    >
                      <span className="min-w-0 truncate">
                        <span className="opus-text-metallic font-display tracking-wide">
                          {a.title}
                        </span>
                        <span className="ml-2 text-opus-warm/55">— {a.artistPenName}</span>
                      </span>
                      <span className="shrink-0 rounded-full border border-opus-gold/45 bg-opus-gold/10 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-opus-gold-light">
                        {badge.primary}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {filtered.artists.length > 0 && (
                <Command.Group heading={t.groupArtists} className="px-1 py-2">
                  {filtered.artists.slice(0, PER_GROUP_LIMIT).map((a) => (
                    <Command.Item
                      key={`ar-${a.id}`}
                      value={`ar-${a.id}`}
                      onSelect={() => navigateAndClose(a.href)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded px-3 py-2 text-sm text-opus-warm/85 aria-selected:bg-white/[0.05] aria-selected:text-opus-warm"
                    >
                      <span className="opus-text-metallic font-display tracking-wide">
                        {a.penName}
                      </span>
                      <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/55">
                        {t.worksCount.replace("{n}", String(a.worksCount))}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {filtered.shelves.length > 0 && (
                <Command.Group heading={t.groupShelves} className="px-1 py-2">
                  {filtered.shelves.slice(0, PER_GROUP_LIMIT).map((s) => (
                    <Command.Item
                      key={`sh-${s.id}`}
                      value={`sh-${s.id}`}
                      onSelect={() => navigateAndClose(s.href)}
                      className="flex cursor-pointer items-start justify-between gap-3 rounded px-3 py-2 text-sm text-opus-warm/85 aria-selected:bg-white/[0.05] aria-selected:text-opus-warm"
                    >
                      <span className="min-w-0">
                        <span className="opus-text-metallic block truncate font-display tracking-wide">
                          {s.title[locale]}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/45">
                          {s.description[locale]}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/55">
                        {t.itemsCount.replace("{n}", String(s.itemCount))}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {filtered.listings.length > 0 && (
                <Command.Group heading={t.groupListings} className="px-1 py-2">
                  {filtered.listings.slice(0, PER_GROUP_LIMIT).map((l) => (
                    <Command.Item
                      key={`ls-${l.id}`}
                      value={`ls-${l.id}`}
                      onSelect={() => navigateAndClose(l.href)}
                      className="flex cursor-pointer items-start justify-between gap-3 rounded px-3 py-2 text-sm text-opus-warm/85 aria-selected:bg-white/[0.05] aria-selected:text-opus-warm"
                    >
                      <span className="min-w-0">
                        <span className="opus-text-metallic block truncate font-display tracking-wide">
                          {l.artworkTitle}
                        </span>
                        <span className="mt-0.5 block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-opus-warm/45">
                          {l.artistPenName} · {l.sellerMasked}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-mono text-xs text-opus-warm/85">
                          {formatJpy(l.priceJpy)}
                        </span>
                        <span className="rounded-full border border-white/[0.18] bg-white/[0.04] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-opus-warm/75">
                          {badge.secondary}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </>
          )}
        </Command.List>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] px-4 py-2 font-sans text-[0.65rem] leading-snug text-opus-warm/55">
          <span className="flex items-center gap-3">
            <span>{t.hintSelect}</span>
            <span>{t.hintMove}</span>
            <span>{t.hintClose}</span>
          </span>
          <span>{t.results.replace("{n}", String(totalCount))}</span>
        </div>
      </Command>
    </div>
  );
}
