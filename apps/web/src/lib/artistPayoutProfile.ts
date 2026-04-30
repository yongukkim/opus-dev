import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AUX_LEDGER_FILES } from "@/lib/ledgerStores";

export type ArtistPayoutProfileRecord = {
  artistId: string;
  updatedAt: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
};

const MAX_BANK_NAME = 120;
const MAX_ACCOUNT_HOLDER = 120;
const MAX_ACCOUNT_NUMBER = 32;

function normalizeBankName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_BANK_NAME);
}

function normalizeAccountHolder(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, MAX_ACCOUNT_HOLDER);
}

function normalizeAccountNumber(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/\D/g, "").slice(0, MAX_ACCOUNT_NUMBER);
}

function parseLine(line: string): ArtistPayoutProfileRecord | null {
  try {
    const parsed = JSON.parse(line) as Partial<ArtistPayoutProfileRecord>;
    const artistId = typeof parsed.artistId === "string" ? parsed.artistId.trim() : "";
    if (!artistId) return null;
    return {
      artistId,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt
          : new Date().toISOString(),
      bankName: normalizeBankName(parsed.bankName),
      accountHolder: normalizeAccountHolder(parsed.accountHolder),
      accountNumber: normalizeAccountNumber(parsed.accountNumber),
    };
  } catch {
    return null;
  }
}

async function readAll(): Promise<ArtistPayoutProfileRecord[]> {
  try {
    const raw = await readFile(AUX_LEDGER_FILES.artistPayoutProfiles, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseLine)
      .filter((row): row is ArtistPayoutProfileRecord => row !== null);
  } catch {
    return [];
  }
}

export async function getArtistPayoutProfile(
  artistId: string,
): Promise<ArtistPayoutProfileRecord | null> {
  const id = artistId.trim();
  if (!id) return null;
  const rows = await readAll();
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i]!.artistId === id) return rows[i]!;
  }
  return null;
}

export async function saveArtistPayoutProfile(input: {
  artistId: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}): Promise<ArtistPayoutProfileRecord> {
  const artistId = input.artistId.trim();
  if (!artistId) throw new Error("invalid_artist_id");
  const next: ArtistPayoutProfileRecord = {
    artistId,
    updatedAt: new Date().toISOString(),
    bankName: normalizeBankName(input.bankName),
    accountHolder: normalizeAccountHolder(input.accountHolder),
    accountNumber: normalizeAccountNumber(input.accountNumber),
  };
  await mkdir(path.dirname(AUX_LEDGER_FILES.artistPayoutProfiles), { recursive: true });
  await writeFile(AUX_LEDGER_FILES.artistPayoutProfiles, `${JSON.stringify(next)}\n`, {
    flag: "a",
    encoding: "utf8",
  });
  return next;
}
