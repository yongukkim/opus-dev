import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type OpusRole = "artist" | "operator" | "collector";

export type Actor = {
  userId: string;
  role: OpusRole;
};

export type SubmissionRecord = {
  id: string;
  createdAt: string;
  artistId: string;
  artistName: string;
  nickname: string;
  artworkTitle: string;
  genre: string;
  year?: number;
  description?: string;
  tags: string[];
  /** Moderation lifecycle: pending review → approved → (optional) changes requested / rejected. */
  reviewStatus?: "pending_review" | "approved" | "changes_requested" | "rejected";
  /** Content rating for discovery/purchase gating. Option B: explicit is rejected; mature is age-gated. */
  contentRating?: "general" | "mature" | "explicit";
  /** Operator note (e.g., reason for rejection or change request). */
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  editionMode: "unique" | "limited";
  editionTotal: number;
  initialMint: number;
  numberingPolicy: "auto" | "manual";
  lockEdition: boolean;
  storedFile: { relativePath: string; filename: string; mime: string; bytes: number };
};

export type OwnershipState = {
  submissionId: string;
  ownerType: "artist" | "collector";
  ownerId: string;
  updatedAt: string;
};

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const PRIVATE_ROOT = path.join(STORAGE_ROOT, "private");
const SUBMISSIONS_FILE = path.join(STORAGE_ROOT, "submissions.jsonl");
const OWNERSHIP_FILE = path.join(STORAGE_ROOT, "ownership-events.jsonl");

export function safeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function buildArtistWorkDir(artistId: string, submissionId: string): string {
  return path.join(PRIVATE_ROOT, "artists", artistId, "works", submissionId);
}

export function buildCollectorWorkDir(collectorId: string, submissionId: string): string {
  return path.join(PRIVATE_ROOT, "collectors", collectorId, "works", submissionId);
}

export async function ensureStorage(): Promise<void> {
  await mkdir(PRIVATE_ROOT, { recursive: true });
}

export async function appendJsonl(filePath: string, obj: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(obj)}\n`, { flag: "a", encoding: "utf8" });
}

export async function appendSubmission(rec: SubmissionRecord): Promise<void> {
  await appendJsonl(SUBMISSIONS_FILE, rec);
}

export async function appendOwnershipEvent(state: OwnershipState): Promise<void> {
  await appendJsonl(OWNERSHIP_FILE, state);
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

export async function getSubmissionById(id: string): Promise<SubmissionRecord | null> {
  const records = await readJsonl<SubmissionRecord>(SUBMISSIONS_FILE);
  for (let i = records.length - 1; i >= 0; i -= 1) {
    if (records[i]?.id === id) return records[i]!;
  }
  return null;
}

/** Latest record per submission id (jsonl append order), across all artists. */
export async function listAllSubmissions(): Promise<SubmissionRecord[]> {
  const records = await readJsonl<SubmissionRecord>(SUBMISSIONS_FILE);
  const byId = new Map<string, SubmissionRecord>();
  for (const r of records) {
    if (r?.id) byId.set(r.id, r);
  }
  const out = [...byId.values()];
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

export async function appendSubmissionReviewPatch(input: {
  submission: SubmissionRecord;
  reviewerId: string;
  reviewStatus: NonNullable<SubmissionRecord["reviewStatus"]>;
  contentRating: NonNullable<SubmissionRecord["contentRating"]>;
  reviewNote?: string;
}): Promise<void> {
  const { submission, reviewerId, reviewStatus, contentRating, reviewNote } = input;
  const patch: SubmissionRecord = {
    ...submission,
    reviewStatus,
    contentRating,
    reviewNote: reviewNote?.trim() ? reviewNote.trim().slice(0, 800) : undefined,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
  };
  await appendSubmission(patch);
}

export async function getCurrentOwner(submissionId: string, fallbackArtistId: string): Promise<OwnershipState> {
  const events = await readJsonl<OwnershipState>(OWNERSHIP_FILE);
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i]?.submissionId === submissionId) return events[i]!;
  }
  return {
    submissionId,
    ownerType: "artist",
    ownerId: fallbackArtistId,
    updatedAt: new Date().toISOString(),
  };
}

export async function transferOwnershipToCollector(input: {
  submission: SubmissionRecord;
  buyerId: string;
}): Promise<{ toRelativePath: string }> {
  const { submission, buyerId } = input;
  const src = path.join(STORAGE_ROOT, submission.storedFile.relativePath);
  const targetDir = buildCollectorWorkDir(buyerId, submission.id);
  await mkdir(targetDir, { recursive: true });
  const to = path.join(targetDir, submission.storedFile.filename);
  await rename(src, to);

  const toRelativePath = path.relative(STORAGE_ROOT, to);
  const patch: SubmissionRecord = {
    ...submission,
    storedFile: { ...submission.storedFile, relativePath: toRelativePath },
  };
  await appendSubmission(patch);
  await appendOwnershipEvent({
    submissionId: submission.id,
    ownerType: "collector",
    ownerId: buyerId,
    updatedAt: new Date().toISOString(),
  });
  return { toRelativePath };
}

export function canAccessSubmission(actor: Actor, submission: SubmissionRecord, owner: OwnershipState): boolean {
  if (actor.role === "operator") return true;
  if (actor.role === "artist" && actor.userId === submission.artistId) return true;
  if (actor.role === "collector" && owner.ownerType === "collector" && owner.ownerId === actor.userId) return true;
  return false;
}

/** Latest record per submission id (jsonl append order). */
export async function listArtistSubmissions(artistId: string): Promise<SubmissionRecord[]> {
  if (!artistId.trim()) return [];
  const records = await readJsonl<SubmissionRecord>(SUBMISSIONS_FILE);
  const byId = new Map<string, SubmissionRecord>();
  for (const r of records) {
    if (r?.id && r.artistId === artistId) {
      byId.set(r.id, r);
    }
  }
  const out: SubmissionRecord[] = [];
  for (const rec of byId.values()) {
    const owner = await getCurrentOwner(rec.id, rec.artistId);
    if (owner.ownerType === "artist" && owner.ownerId === artistId) {
      out.push(rec);
    }
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

