import { NextRequest, NextResponse } from "next/server";
import {
  appendCollectorTransferListing,
  COLLECTOR_TRANSFER_GENRES,
  type CollectorTransferListing,
} from "@/lib/collectorTransferListings";
import { readActorFromRequest } from "@/lib/authContext";
import { resolveTransferRegisterLockedWork } from "@/lib/transferRegisterLockedWork";

export const runtime = "nodejs";

function requireString(fd: FormData, key: string, maxLen: number): string {
  const v = fd.get(key);
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  const s = v.trim();
  if (!s || s.length > maxLen) throw new Error(`invalid:${key}`);
  return s;
}

function optionalString(fd: FormData, key: string, maxLen: number): string {
  const v = fd.get(key);
  if (typeof v !== "string") return "";
  return v.trim().slice(0, maxLen);
}

function requireInt(fd: FormData, key: string, min: number, max: number): number {
  const v = fd.get(key);
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`invalid:${key}`);
  return n;
}

function requireBool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  if (typeof v !== "string") throw new Error(`invalid:${key}`);
  if (v !== "true" && v !== "false") throw new Error(`invalid:${key}`);
  return v === "true";
}

function requireGenre(fd: FormData): string {
  const g = requireString(fd, "genre", 40);
  if (!COLLECTOR_TRANSFER_GENRES.has(g)) throw new Error("invalid:genre");
  return g;
}

function requireSaleMode(fd: FormData): "fixed" | "auction" {
  const v = fd.get("saleMode");
  if (typeof v !== "string") throw new Error("invalid:saleMode");
  if (v !== "fixed" && v !== "auction") throw new Error("invalid:saleMode");
  return v;
}

function optionalYear(fd: FormData): string {
  const raw = optionalString(fd, "year", 8);
  if (!raw) return "";
  const y = Number.parseInt(raw, 10);
  const current = new Date().getFullYear();
  if (!Number.isFinite(y) || y < 1900 || y > current + 1) throw new Error("invalid:year");
  return raw;
}

function validateYearString(raw: string): string {
  if (!raw) return "";
  const y = Number.parseInt(raw, 10);
  const current = new Date().getFullYear();
  if (!Number.isFinite(y) || y < 1900 || y > current + 1) throw new Error("invalid:year");
  return raw;
}

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.14.2.1 (§1) Input Validation & Sanitization
 *   KO: 컬렉터 이전 등록은 신뢰할 수 없는 입력이므로 역할·필드 길이·가격 범위를 서버에서 화이트리스트 검증합니다.
 *   JA: コレクター間の譲渡登録は信頼できない入力のため、役割・フィールド長・価格範囲をサーバでホワイトリスト検証します。
 *   EN: Collector transfer listings are untrusted input; the server validates role, field lengths, and price bounds.
 * - A.9.2.1 (§4) Least Privilege RBAC
 *   KO: 등록은 collector·artist 역할만 허용합니다.
 *   JA: 登録は collector / artist 役割のみ許可します。
 *   EN: Only collector and artist roles may create listings.
 * - A.18.1.4 (§7) Privacy by Design / APPI
 *   KO: 작가 본명은 저장될 수 있으나 공개 목록 조회 경로에서는 필드가 제거되어 노출되지 않습니다.
 *   JA: 作家の本名は保存され得ますが、公開一覧の取得経路では当該フィールドを除去し表示しません。
 *   EN: Artist legal names may be stored at rest but are stripped before public listing responses/UI.
 * - When `submissionId` is present, artwork fields are taken only from the approved submission after
 *   ownership re-check (`resolveTransferRegisterLockedWork`); collectors must supply `submissionId`.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await readActorFromRequest(request);
    if (!actor || (actor.role !== "collector" && actor.role !== "artist")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const fd = await request.formData();
    const submissionIdRaw = optionalString(fd, "submissionId", 120);
    const locked =
      submissionIdRaw.length > 0
        ? await resolveTransferRegisterLockedWork(submissionIdRaw, actor.userId)
        : null;
    if (submissionIdRaw && !locked) {
      return NextResponse.json({ ok: false, error: "forbidden_submission" }, { status: 403 });
    }
    if (actor.role === "collector" && !locked) {
      return NextResponse.json({ ok: false, error: "submission_required" }, { status: 400 });
    }

    const priceJpy = requireInt(fd, "priceJpy", 1, 99_999_999);
    const saleMode = requireSaleMode(fd);
    const noteRaw = optionalString(fd, "note", 800);
    const note = noteRaw || undefined;
    const rightsConfirmed = requireBool(fd, "rightsConfirmed");
    if (!rightsConfirmed) throw new Error("invalid:rightsConfirmed");

    let artistPenName: string;
    let artworkTitle: string;
    let genre: string;
    let year: string;
    let description: string | undefined;
    let tags: string | undefined;
    let editionRef: string;
    let artistLegalName: string | undefined;
    let sourceSubmissionId: string | undefined;

    if (locked) {
      artistPenName = locked.artistPenName.slice(0, 120);
      artworkTitle = locked.artworkTitle.slice(0, 200);
      genre = locked.genre;
      year = validateYearString(locked.year);
      description = locked.description ? locked.description.slice(0, 4000) : undefined;
      tags = locked.tags ? locked.tags.slice(0, 400) : undefined;
      editionRef = locked.editionRef.slice(0, 160);
      // Collector transfer listings publish artist pen name only.
      artistLegalName = undefined;
      sourceSubmissionId = locked.submissionId;
    } else {
      const artistLegalRaw = optionalString(fd, "artistLegalName", 120);
      artistLegalName = artistLegalRaw || undefined;
      artistPenName = requireString(fd, "artistPenName", 120);
      artworkTitle = requireString(fd, "artworkTitle", 200);
      genre = requireGenre(fd);
      year = optionalYear(fd);
      const descriptionRaw = optionalString(fd, "description", 4000);
      description = descriptionRaw || undefined;
      const tagsRaw = optionalString(fd, "tags", 400);
      tags = tagsRaw || undefined;
      editionRef = optionalString(fd, "editionRef", 160);
    }

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const rec: CollectorTransferListing = {
      id,
      createdAt: new Date().toISOString(),
      ...(sourceSubmissionId ? { sourceSubmissionId } : {}),
      sellerId: actor.userId,
      sellerRole: actor.role === "artist" ? "artist" : "collector",
      artistLegalName,
      artistPenName,
      artworkTitle,
      genre,
      year,
      description,
      tags,
      editionRef,
      saleMode,
      priceJpy,
      note,
      status: "open",
    };
    await appendCollectorTransferListing(rec);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
}
