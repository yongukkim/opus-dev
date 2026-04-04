import { readFile } from "node:fs/promises";
import path from "node:path";
import { appendJsonl } from "@/lib/privateStorage";

const STORAGE_ROOT = path.join(process.cwd(), "storage");
export const COLLECTOR_TRANSFER_LISTINGS_FILE = path.join(STORAGE_ROOT, "collector-transfer-listings.jsonl");

/** Stored record; `artistLegalName` is never exposed on the public listings surface (APPI / collector experience). */
export type CollectorTransferListing = {
  id: string;
  createdAt: string;
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
  priceJpy: number;
  note?: string;
  status: "open";
};

/** Safe for public listing pages (excludes legal name). */
export type CollectorTransferListingPublic = Omit<CollectorTransferListing, "artistLegalName">;

function parseListingLine(line: string): CollectorTransferListing | null {
  try {
    const raw = JSON.parse(line) as Partial<CollectorTransferListing>;
    if (!raw.id || raw.status !== "open") return null;
    if (typeof raw.sellerId !== "string" || typeof raw.artworkTitle !== "string") return null;
    const priceJpy = typeof raw.priceJpy === "number" ? raw.priceJpy : Number.NaN;
    if (!Number.isFinite(priceJpy) || priceJpy < 1) return null;
    return {
      id: raw.id,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
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
      priceJpy,
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

export function maskSellerId(userId: string): string {
  const t = userId.trim();
  if (t.length <= 4) return "····";
  return `···${t.slice(-4)}`;
}
