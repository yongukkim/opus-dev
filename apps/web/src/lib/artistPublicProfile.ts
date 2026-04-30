import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AUX_LEDGER_FILES } from "@/lib/ledgerStores";

export type ArtistPublicProfileRecord = {
  artistId: string;
  updatedAt: string;
  bio: string;
  useSsoImage: boolean;
};

const MAX_BIO_LEN = 600;

function normalizeBio(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_BIO_LEN);
}

function parseLine(line: string): ArtistPublicProfileRecord | null {
  try {
    const parsed = JSON.parse(line) as Partial<ArtistPublicProfileRecord>;
    const artistId = typeof parsed.artistId === "string" ? parsed.artistId.trim() : "";
    if (!artistId) return null;
    return {
      artistId,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt
          : new Date().toISOString(),
      bio: normalizeBio(parsed.bio),
      useSsoImage: parsed.useSsoImage === true,
    };
  } catch {
    return null;
  }
}

async function readAll(): Promise<ArtistPublicProfileRecord[]> {
  try {
    const raw = await readFile(AUX_LEDGER_FILES.artistPublicProfiles, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseLine)
      .filter((row): row is ArtistPublicProfileRecord => row !== null);
  } catch {
    return [];
  }
}

export async function getArtistPublicProfile(
  artistId: string,
): Promise<ArtistPublicProfileRecord | null> {
  const id = artistId.trim();
  if (!id) return null;
  const rows = await readAll();
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i]!.artistId === id) return rows[i]!;
  }
  return null;
}

export async function getArtistSsoImageOptInMap(): Promise<Map<string, boolean>> {
  const rows = await readAll();
  const out = new Map<string, boolean>();
  for (const row of rows) out.set(row.artistId, row.useSsoImage);
  return out;
}

export async function saveArtistPublicProfile(input: {
  artistId: string;
  bio: string;
  useSsoImage: boolean;
}): Promise<ArtistPublicProfileRecord> {
  const artistId = input.artistId.trim();
  if (!artistId) throw new Error("invalid_artist_id");
  const next: ArtistPublicProfileRecord = {
    artistId,
    updatedAt: new Date().toISOString(),
    bio: normalizeBio(input.bio),
    useSsoImage: input.useSsoImage === true,
  };
  await mkdir(path.dirname(AUX_LEDGER_FILES.artistPublicProfiles), { recursive: true });
  await writeFile(AUX_LEDGER_FILES.artistPublicProfiles, `${JSON.stringify(next)}\n`, {
    flag: "a",
    encoding: "utf8",
  });
  return next;
}
