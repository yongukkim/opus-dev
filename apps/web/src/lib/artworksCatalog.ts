import { readdir } from "node:fs/promises";
import path from "node:path";

export const TOTAL_EDITIONS = 50;
export const PAGE_SIZE = 20;

export const FALLBACK = [
  "unsplash_01_HzI3vf8wUwE.jpg",
  "unsplash_02_H2Z8A4af4Zo.jpg",
  "unsplash_03_4MksxMVbRrA.jpg",
  "unsplash_04_h7EvXCadies.jpg",
  "unsplash_05_HI0GShPQegc.jpg",
  "unsplash_06_a5RK_uk5Ej0.jpg",
  "unsplash_07_RBqC7kQoMIg.jpg",
  "unsplash_08__sZ7R0C_xKY.jpg",
  "unsplash_09_QVRHf8Gc9Pk.jpg",
  "unsplash_10_zl8hQxXZCeI.jpg",
  "unsplash_11_aVFTleL-L0g.jpg",
  "unsplash_12_dPn-PAuwYss.jpg",
  "unsplash_13_dKB6EJFLUaA.jpg",
  "unsplash_14_UG2Vqz5Q000.jpg",
  "unsplash_15_nuRF1oaw-Pg.jpg",
  "unsplash_16_GB1sPyY2YpQ.jpg",
  "unsplash_17_Bqrr9yrKD1o.jpg",
  "unsplash_18_KC5btjnw0_s.jpg",
  "unsplash_19_DQpHtE5WY-U.jpg",
  "unsplash_20_4hYSTQkZMNQ.jpg",
] as const;

export async function listLocalArtworks(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", "local-artworks");
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
  } catch {
    return [];
  }
}

export function stripExt(filename: string): string {
  return filename.replace(/\.[a-z0-9]+$/i, "");
}

export function prettifyToken(value: string): string {
  return value
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTitleArtist(file: string, idx: number): { title: string; artist: string } {
  const base = stripExt(file);

  if (base.includes(" - ")) {
    const [artistRaw = "", ...titleParts] = base.split(" - ");
    const artist = prettifyToken(artistRaw);
    const title = prettifyToken(titleParts.join(" - "));
    if (artist && title) return { title, artist };
  }

  if (base.includes("_")) {
    const [artistRaw = "", ...titleParts] = base.split("_");
    const artist = prettifyToken(artistRaw);
    const title = prettifyToken(titleParts.join(" "));
    if (artist && title) return { title, artist };
  }

  return { title: `Premiere ${idx + 1}`, artist: "Unknown" };
}

/** URL-safe opaque id for a catalog filename (UTF-8 → base64url). */
export function encodeArtworkSlug(filename: string): string {
  return Buffer.from(filename, "utf8").toString("base64url");
}

export function decodeArtworkSlug(slug: string): string | null {
  try {
    const file = Buffer.from(slug, "base64url").toString("utf8");
    if (!file || file.length > 512) return null;
    if (file.includes("\0") || file.includes("/") || file.includes("\\")) return null;
    return file;
  } catch {
    return null;
  }
}

export async function loadCatalogFiles(): Promise<{ files: string[]; useLocal: boolean; base: string }> {
  const local = await listLocalArtworks();
  const useLocal = local.length > 0;
  const files = useLocal ? local : [...FALLBACK];
  const base = useLocal ? "/local-artworks" : "/sample-artworks";
  return { files, useLocal, base };
}

export async function resolveArtworkBySlug(slug: string): Promise<{
  file: string;
  globalIndex: number;
  base: string;
  useLocal: boolean;
} | null> {
  const decoded = decodeArtworkSlug(slug);
  if (!decoded) return null;
  if (!/\.(png|jpe?g|webp)$/i.test(decoded)) return null;
  const { files, base, useLocal } = await loadCatalogFiles();
  const globalIndex = files.indexOf(decoded);
  if (globalIndex < 0) return null;
  return { file: decoded, globalIndex, base, useLocal };
}

export type CatalogEntryRef = { file: string; globalIndex: number };

/** Other works in circular order (same catalog list) for “related” rails. */
export function pickRelatedCatalogEntries(
  files: readonly string[],
  currentFile: string,
  globalIndex: number,
  count: number,
): CatalogEntryRef[] {
  const n = files.length;
  if (n <= 1) return [];
  const out: CatalogEntryRef[] = [];
  for (let step = 1; step < n && out.length < count; step++) {
    const j = (globalIndex + step) % n;
    const f = files[j]!;
    if (f === currentFile) continue;
    if (out.some((x) => x.file === f)) continue;
    out.push({ file: f, globalIndex: j });
  }
  return out;
}

/** Same parsed artist string as `parseTitleArtist` (filename-derived in demo). */
export function pickSameArtistCatalogEntries(
  files: readonly string[],
  currentFile: string,
  artist: string,
  limit: number,
): CatalogEntryRef[] {
  const out: CatalogEntryRef[] = [];
  for (let i = 0; i < files.length && out.length < limit; i++) {
    const f = files[i]!;
    if (f === currentFile) continue;
    const { artist: a } = parseTitleArtist(f, i);
    if (a === artist) out.push({ file: f, globalIndex: i });
  }
  return out;
}

/** Demo-only list price in JPY for public catalog assets (not artist submissions). */
export function demoListPriceJpy(globalIndex: number): number {
  return 12_000 + ((globalIndex * 19) % 88_000);
}
