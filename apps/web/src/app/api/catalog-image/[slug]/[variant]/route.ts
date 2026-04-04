import { readFile } from "node:fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  renderCatalogPublicPreviewWatermarked,
  renderCatalogThumb,
  renderCatalogVaultPreviewWatermarked,
  resolvePublicArtworkPath,
} from "@/lib/catalogImageServe";
import { resolveArtworkBySlug } from "@/lib/artworksCatalog";
import { hasDemoSessionFromCookies } from "@/lib/demoSession";

export const runtime = "nodejs";

const VARIANTS = new Set(["thumb", "preview", "vault"]);

/**
 * ISO 27001 / OPUS Security Coding Standards
 * - A.14.2.1 (§1) Input Validation & Sanitization
 *   KO: 슬러그·variant·경로를 화이트리스트로 검증하고 공개 카탈로그 디렉터리 밖으로 벗어나지 않습니다.
 *   JA: スラッグ・variant・パスをホワイトリスト検証し、公開カタログディレクトリ外へ出ません。
 *   EN: Slug, variant, and filesystem paths are validated against an allowlist under public catalog dirs.
 * - A.9.4.2 (§2) Session / auth surface
 *   KO: `vault` 변형은 데모 세션 쿠키가 있을 때만 반환해 고해상도 파생 노출을 제한합니다.
 *   JA: `vault` はデモセッションがある場合のみ返し、高解像度派生の露出を制限します。
 *   EN: The `vault` variant is returned only when a demo session cookie is present.
 * - A.13.1.3 (§6) API Security
 *   KO: 원본 파일 대신 파생 WebP만 제공합니다.
 *   JA: 原ファイルの代わりに派生WebPのみを提供します。
 *   EN: Serves derived WebP only, not raw masters.
 * - Google / indexing (policy, not DRM)
 *   KO: X-Robots-Tag로 색인 거부를 요청합니다. 공개 HTML은 보통 저해상 `preview`만 참조합니다.
 *   JA: X-Robots-Tag でインデックス拒否を依頼します。公開HTMLは低解像 preview を主に参照します。
 *   EN: X-Robots-Tag requests noindex; public HTML typically references low-res `preview` only.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string; variant: string }> },
): Promise<Response> {
  const { slug, variant } = await ctx.params;
  if (!VARIANTS.has(variant)) {
    return NextResponse.json({ ok: false, error: "invalid_variant" }, { status: 400 });
  }

  if (variant === "vault") {
    const cookieStore = await cookies();
    if (!hasDemoSessionFromCookies(cookieStore)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const resolved = await resolveArtworkBySlug(slug);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let absPath: string;
  try {
    absPath = resolvePublicArtworkPath(resolved.base, resolved.file);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_path" }, { status: 400 });
  }

  try {
    await readFile(absPath);
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const body =
      variant === "thumb"
        ? await renderCatalogThumb(absPath)
        : variant === "preview"
          ? await renderCatalogPublicPreviewWatermarked(absPath)
          : await renderCatalogVaultPreviewWatermarked(absPath);

    const cacheControl =
      variant === "vault"
        ? "private, max-age=1800, stale-while-revalidate=3600"
        : "public, max-age=86400, stale-while-revalidate=604800";

    const headers: Record<string, string> = {
      "Content-Type": "image/webp",
      "Cache-Control": cacheControl,
      "X-Robots-Tag": "noindex, noimageindex",
    };
    if (variant === "vault") {
      headers["Vary"] = "Cookie";
    }

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
