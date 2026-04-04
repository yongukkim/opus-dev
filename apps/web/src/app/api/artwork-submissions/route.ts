import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readActorFromRequest } from "@/lib/authContext";
import {
  appendOwnershipEvent,
  appendSubmission,
  buildArtistWorkDir,
  ensureStorage,
  safeSlug,
  type SubmissionRecord,
} from "@/lib/privateStorage";

export const runtime = "nodejs";

const MAX_EDITIONS = 20;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"]);

function requireString(fd: FormData, key: string, maxLen = 160): string {
  const v = fd.get(key);
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  const s = v.trim();
  if (!s || s.length > maxLen) throw new Error(`invalid:${key}`);
  return s;
}

function optionalString(fd: FormData, key: string, maxLen = 2000): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.slice(0, maxLen);
}

function requireInt(fd: FormData, key: string, min: number, max: number): number {
  const v = fd.get(key);
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`invalid:${key}`);
  return n;
}

function requireEnum<T extends string>(fd: FormData, key: string, allowed: readonly T[]): T {
  const v = fd.get(key);
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  if (!allowed.includes(v as T)) throw new Error(`invalid:${key}`);
  return v as T;
}

function requireBool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  if (v !== "true" && v !== "false") throw new Error(`invalid:${key}`);
  return v === "true";
}

function parseTags(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 16);
}

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.14.2.1 (§1) Input Validation & Sanitization
 *   KO: 폼/파일 업로드는 신뢰할 수 없으므로 서버에서 길이·형식·허용 타입·용량·가격·분류(남성향/여성향 열거)를 화이트리스트로 검증한 뒤 저장합니다(에디션 총수 ≤ 20 포함).
 *   JA: フォーム/ファイルは信頼できないため、サーバ側で長さ・形式・許可タイプ・容量・価格・分類（男性向け/女性向けの列挙）をホワイトリスト検証してから保存します（総エディション ≤ 20 を含む）。
 *   EN: Treat form/file uploads as untrusted; validate length/format/allowed types/size, JPY price, and audience category enum with a strict allowlist before persisting (including total editions ≤ 20).
 */
export async function POST(request: NextRequest) {
  try {
    const actor = readActorFromRequest(request);
    if (!actor || (actor.role !== "artist" && actor.role !== "operator")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const fd = await request.formData();

    const artistName = requireString(fd, "artistName");
    const nickname = requireString(fd, "nickname");
    const artworkTitle = requireString(fd, "artworkTitle", 200);
    const genre = requireString(fd, "genre", 40);
    const audienceCategory = requireEnum(fd, "audienceCategory", ["male", "female"] as const);
    const yearRaw = optionalString(fd, "year", 8);
    const description = optionalString(fd, "description", 2000);
    const tags = parseTags(optionalString(fd, "tags", 400));

    const editionMode = requireEnum(fd, "editionMode", ["unique", "limited"] as const);
    const editionTotal = requireInt(fd, "editionTotal", 1, MAX_EDITIONS);
    if (editionMode === "unique" && editionTotal !== 1) throw new Error("invalid:editionTotal");

    const initialMint = requireInt(fd, "initialMint", 1, editionTotal);
    const numberingPolicy = requireEnum(fd, "numberingPolicy", ["auto", "manual"] as const);
    const lockEdition = requireBool(fd, "lockEdition");
    const rightsConfirmed = requireBool(fd, "rightsConfirmed");
    if (!rightsConfirmed) throw new Error("invalid:rightsConfirmed");

    const priceJpy = requireInt(fd, "priceJpy", 1, 99_999_999);

    const yearParsed = yearRaw ? Number.parseInt(yearRaw, 10) : undefined;
    if (
      yearRaw &&
      (yearParsed == null ||
        !Number.isFinite(yearParsed) ||
        yearParsed < 1900 ||
        yearParsed > new Date().getFullYear() + 1)
    ) {
      throw new Error("invalid:year");
    }
    const year = yearParsed;

    const file = fd.get("file");
    if (!(file instanceof File)) throw new Error("invalid:file");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("invalid:file");

    const ext = path.extname(file.name).toLowerCase();
    if (!ACCEPTED_EXT.has(ext)) throw new Error("invalid:file");

    const buf = Buffer.from(await file.arrayBuffer());
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const safeBase = safeSlug(`${nickname}-${artworkTitle}`) || "artwork";
    const filename = `${safeBase}-${id}${ext}`;

    await ensureStorage();
    const workDir = buildArtistWorkDir(actor.userId, id);
    await mkdir(workDir, { recursive: true });
    const storedAbsPath = path.join(workDir, filename);
    await writeFile(storedAbsPath, buf);
    const storedRelativePath = path.relative(path.join(process.cwd(), "storage"), storedAbsPath);

    const rec: SubmissionRecord = {
      id,
      createdAt: new Date().toISOString(),
      artistId: actor.userId,
      artistName,
      nickname,
      artworkTitle,
      genre,
      audienceCategory,
      year,
      description,
      tags,
      reviewStatus: "pending_review",
      contentRating: "general",
      editionMode,
      editionTotal,
      initialMint,
      numberingPolicy,
      lockEdition,
      priceJpy,
      storedFile: {
        relativePath: storedRelativePath,
        filename,
        mime: file.type || "application/octet-stream",
        bytes: file.size,
      },
    };
    await appendSubmission(rec);
    await appendOwnershipEvent({
      submissionId: id,
      ownerType: "artist",
      ownerId: actor.userId,
      updatedAt: rec.createdAt,
    });

    return NextResponse.json({ ok: true, id, filename, storedRelativePath }, { status: 201 });
  } catch {
    // Intentionally avoid echoing internal details.
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
}

