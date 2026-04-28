import { readFile } from "node:fs/promises";
import { AUX_LEDGER_FILES } from "@/lib/ledgerStores";
import { appendJsonl } from "@/lib/privateStorage";

export const COLLECTOR_TRANSFER_LISTINGS_FILE = AUX_LEDGER_FILES.collectorTransferListings;

/** Must match artwork submission genre keys (`ArtworkSubmissionForm`, API POST). */
export const COLLECTOR_TRANSFER_GENRES = new Set([
  "digital-painting",
  "photography",
  "3d",
  "generative",
  "illustration",
  "video",
  "mixed-media",
  "other",
]);

export type CollectorTransferAuctionOptions = {
  /** Auction end time (ISO). */
  endAt: string;
  /** Starting bid in JPY. */
  startingBidJpy: number;
  /** Optional reserve price in JPY (must be >= startingBidJpy). */
  reservePriceJpy?: number;
  /** Optional buyout price in JPY (must be > startingBidJpy). */
  buyoutPriceJpy?: number;
  /** Optional minimum increment per bid (JPY). */
  minIncrementJpy?: number;
  /** Optional anti-sniping extension policy. */
  antiSniping?: { triggerWindowMinutes: number; extendWindowMinutes: number };
  /** Optional visibility preferences (public projection only). */
  visibility?: { showAuctionSummary: boolean };
};

/** Stored record; `artistLegalName` is never exposed on the public listings surface (APPI / collector experience). */
export type CollectorTransferListing = {
  id: string;
  createdAt: string;
  /** When set, listing artwork fields were copied from this approved submission at registration time. */
  sourceSubmissionId?: string;
  sellerId: string;
  sellerRole: "collector" | "artist";
  /** Verified / internal use only — omit from public API and listing UI. */
  artistLegalName?: string;
  /** Public display name for the creator (pen name). */
  artistPenName: string;
  artworkTitle: string;
  genre: string;
  year: string;
  description?: string;
  tags?: string;
  editionRef: string;
  /** `fixed` = holder-set asking amount; `auction` = same field stored as opening/reserve (JPY). */
  saleMode: "fixed" | "auction";
  priceJpy: number;
  /** Auction-only options. Backward-compatible with legacy `saleMode=auction` rows that only had `priceJpy`. */
  auction?: CollectorTransferAuctionOptions;
  note?: string;
  status: "open";
};

/** Safe for public listing pages (excludes legal name). */
export type CollectorTransferListingPublic = Omit<CollectorTransferListing, "artistLegalName">;

function parseListingLine(line: string): CollectorTransferListing | null {
  try {
    const raw = JSON.parse(line) as Partial<CollectorTransferListing> & {
      auction?: Partial<CollectorTransferAuctionOptions>;
    };
    if (!raw.id || raw.status !== "open") return null;
    if (typeof raw.sellerId !== "string" || typeof raw.artworkTitle !== "string") return null;
    const priceJpy = typeof raw.priceJpy === "number" ? raw.priceJpy : Number.NaN;
    if (!Number.isFinite(priceJpy) || priceJpy < 1) return null;
    const saleMode = raw.saleMode === "auction" ? "auction" : "fixed";
    const auction =
      saleMode === "auction" && raw.auction && typeof raw.auction === "object"
        ? {
            endAt:
              typeof raw.auction.endAt === "string" && raw.auction.endAt.trim()
                ? raw.auction.endAt.trim()
                : undefined,
            startingBidJpy:
              typeof raw.auction.startingBidJpy === "number" && Number.isFinite(raw.auction.startingBidJpy)
                ? raw.auction.startingBidJpy
                : undefined,
            reservePriceJpy:
              typeof raw.auction.reservePriceJpy === "number" && Number.isFinite(raw.auction.reservePriceJpy)
                ? raw.auction.reservePriceJpy
                : undefined,
            buyoutPriceJpy:
              typeof raw.auction.buyoutPriceJpy === "number" && Number.isFinite(raw.auction.buyoutPriceJpy)
                ? raw.auction.buyoutPriceJpy
                : undefined,
            minIncrementJpy:
              typeof raw.auction.minIncrementJpy === "number" && Number.isFinite(raw.auction.minIncrementJpy)
                ? raw.auction.minIncrementJpy
                : undefined,
            antiSniping:
              raw.auction.antiSniping &&
              typeof raw.auction.antiSniping === "object" &&
              typeof raw.auction.antiSniping.triggerWindowMinutes === "number" &&
              typeof raw.auction.antiSniping.extendWindowMinutes === "number"
                ? {
                    triggerWindowMinutes: raw.auction.antiSniping.triggerWindowMinutes,
                    extendWindowMinutes: raw.auction.antiSniping.extendWindowMinutes,
                  }
                : undefined,
            visibility:
              raw.auction.visibility &&
              typeof raw.auction.visibility === "object" &&
              typeof raw.auction.visibility.showAuctionSummary === "boolean"
                ? { showAuctionSummary: raw.auction.visibility.showAuctionSummary }
                : undefined,
          }
        : null;
    const normalizedAuction: CollectorTransferAuctionOptions | undefined =
      saleMode !== "auction"
        ? undefined
        : auction?.endAt && typeof auction.startingBidJpy === "number" && auction.startingBidJpy >= 1
          ? {
              endAt: auction.endAt,
              startingBidJpy: auction.startingBidJpy,
              ...(typeof auction.reservePriceJpy === "number" ? { reservePriceJpy: auction.reservePriceJpy } : {}),
              ...(typeof auction.buyoutPriceJpy === "number" ? { buyoutPriceJpy: auction.buyoutPriceJpy } : {}),
              ...(typeof auction.minIncrementJpy === "number" ? { minIncrementJpy: auction.minIncrementJpy } : {}),
              ...(auction.antiSniping ? { antiSniping: auction.antiSniping } : {}),
              ...(auction.visibility ? { visibility: auction.visibility } : {}),
            }
          : {
              // Back-compat: legacy auction rows stored only `priceJpy` as opening/reserve.
              endAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
              startingBidJpy: priceJpy,
            };
    return {
      id: raw.id,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
      sourceSubmissionId:
        typeof raw.sourceSubmissionId === "string" && raw.sourceSubmissionId.trim()
          ? raw.sourceSubmissionId.trim().slice(0, 80)
          : undefined,
      sellerId: raw.sellerId,
      sellerRole: raw.sellerRole === "artist" ? "artist" : "collector",
      artistLegalName: typeof raw.artistLegalName === "string" && raw.artistLegalName.trim() ? raw.artistLegalName.trim() : undefined,
      artistPenName: (raw.artistPenName ?? "—").toString().trim() || "—",
      artworkTitle: raw.artworkTitle.trim(),
      genre: typeof raw.genre === "string" ? raw.genre : "",
      year: typeof raw.year === "string" ? raw.year : "",
      description: typeof raw.description === "string" && raw.description.trim() ? raw.description.trim() : undefined,
      tags: typeof raw.tags === "string" && raw.tags.trim() ? raw.tags.trim() : undefined,
      editionRef: typeof raw.editionRef === "string" ? raw.editionRef.trim() : "",
      saleMode,
      priceJpy,
      auction: normalizedAuction,
      note: typeof raw.note === "string" && raw.note.trim() ? raw.note.trim() : undefined,
      status: "open",
    };
  } catch {
    return null;
  }
}

async function readAllLines(): Promise<CollectorTransferListing[]> {
  try {
    const raw = await readFile(COLLECTOR_TRANSFER_LISTINGS_FILE, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => parseListingLine(line))
      .filter((r): r is CollectorTransferListing => r != null);
  } catch {
    return [];
  }
}

export async function appendCollectorTransferListing(rec: CollectorTransferListing): Promise<void> {
  await appendJsonl(COLLECTOR_TRANSFER_LISTINGS_FILE, rec);
}

function toPublicListing(r: CollectorTransferListing): CollectorTransferListingPublic {
  const { artistLegalName: _omit, ...pub } = r;
  return pub;
}

/** Latest open row per id (append order); newest first. Legal name stripped for public use. */
export async function listOpenCollectorTransferListings(): Promise<CollectorTransferListingPublic[]> {
  const records = await readAllLines();
  const byId = new Map<string, CollectorTransferListing>();
  for (const r of records) {
    if (r?.id && r.status === "open") byId.set(r.id, r);
  }
  const out = [...byId.values()].map(toPublicListing);
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

/**
 * Single open listing by id, or `null` if the id is unknown or the listing
 * is no longer open. Backs `/provenance/[id]` (PR-18) + the ⌘K deep-link
 * cutover. Returned shape is the PII-safe public projection — legal name
 * is stripped — so a detail page never has to re-mask.
 */
export async function findOpenCollectorTransferListing(
  id: string,
): Promise<CollectorTransferListingPublic | null> {
  if (!id) return null;
  const records = await readAllLines();
  let latest: CollectorTransferListing | null = null;
  for (const r of records) {
    if (r?.id === id && r.status === "open") latest = r;
  }
  return latest ? toPublicListing(latest) : null;
}

export function maskSellerId(userId: string): string {
  const t = userId.trim();
  if (t.length <= 4) return "····";
  return `···${t.slice(-4)}`;
}
