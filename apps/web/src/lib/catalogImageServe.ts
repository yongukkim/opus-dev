import path from "node:path";
import sharp from "sharp";

const ALLOWED_PUBLIC_SUBDIRS = new Set(["local-artworks", "sample-artworks"]);

const THUMB_MAX_PX = 520;
const THUMB_WEBP_QUALITY = 52;

/** Anonymous / crawler PDP image — small file, heavy compression (Facebook-style teaser). */
const PUBLIC_PREVIEW_MAX_PX = 480;
const PUBLIC_PREVIEW_WEBP_QUALITY = 40;

/** Signed-in (demo) session — larger watermarked preview, still not original master. */
const VAULT_PREVIEW_MAX_PX = 1280;
const VAULT_PREVIEW_WEBP_QUALITY = 62;

/** Mobile immersive “fit screen” tier — still derivative bytes, not master. */
const IMMERSIVE_FIT_MAX_PX = 900;
const IMMERSIVE_FIT_WEBP_QUALITY = 56;

/** OPUS tiled text watermark: ~1.5× base = “50% larger” on submission/catalog previews. */
const WATERMARK_PATTERN_SCALE = 1.5;

/**
 * Resolve a readable file path under `public/local-artworks` or `public/sample-artworks` only.
 * ISO 27001 A.14.2.1 (§1)
 * KO: base·파일명을 화이트리스트로 제한하고 경로 이탈( ../ 등)을 차단합니다.
 * JA: base・ファイル名をホワイトリストに限定し、パストラバーサルを防ぎます。
 * EN: Allowlist public subdirs and filenames; block path traversal.
 */
export function resolvePublicArtworkPath(base: string, file: string): string {
  const dir = base.replace(/^\/+|\/+$/g, "");
  if (!ALLOWED_PUBLIC_SUBDIRS.has(dir)) {
    throw new Error("invalid_base");
  }
  if (!file || file.includes("/") || file.includes("\\") || file.includes("\0")) {
    throw new Error("invalid_file");
  }
  const root = path.resolve(process.cwd(), "public", dir);
  const abs = path.resolve(root, file);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("path_traversal");
  }
  return abs;
}

function watermarkSvg(width: number, height: number, tier: "public" | "vault"): Buffer {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const fillA = tier === "public" ? "0.34" : "0.22";
  const strokeA = tier === "public" ? "0.2" : "0.14";
  const s = WATERMARK_PATTERN_SCALE;
  const fontSize = String(Math.round((tier === "public" ? 40 : 34) * s));
  const patW = String(Math.round((tier === "public" ? 200 : 220) * s));
  const patH = String(Math.round((tier === "public" ? 150 : 180) * s));
  const tx = String(Math.round((tier === "public" ? 100 : 110) * s));
  const ty = String(Math.round((tier === "public" ? 88 : 96) * s));
  const strokeW = (0.6 * s).toFixed(2);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="opusWm" width="${patW}" height="${patH}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30 ${cx} ${cy})">
      <text x="${tx}" y="${ty}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="600"
        text-anchor="middle" dominant-baseline="middle" fill="rgba(222,184,146,${fillA})" stroke="rgba(0,0,0,${strokeA})" stroke-width="${strokeW}">OPUS</text>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#opusWm)"/>
</svg>`;
  return Buffer.from(svg);
}

/** Low-resolution grid / rail thumbnail (WebP). */
export async function renderCatalogThumb(absPath: string): Promise<Buffer> {
  return sharp(absPath)
    .rotate()
    .resize(THUMB_MAX_PX, THUMB_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: THUMB_WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

const VIDEO_PREVIEW_EXT = new Set([".mp4", ".webm"]);

/**
 * ISO 27001 A.14.2.1 (§1) — treat non-raster masters predictably for public derivatives.
 * KO: 동영상 원본은 공개 파생 WebP로 직접 변환하지 않고, 동일 정책의 워터마크 플레이스홀더만 제공합니다.
 * JA: 動画原本は公開派生WebPへ直接変換せず、同一方針の透かしプレースホルダのみ提供します。
 * EN: Video masters do not transcode to public WebP; only a watermarked placeholder under the same policy.
 */
export function isVideoSubmissionMaster(absPath: string, mime?: string): boolean {
  const ext = path.extname(absPath).toLowerCase();
  if (VIDEO_PREVIEW_EXT.has(ext)) return true;
  const m = (mime ?? "").trim().toLowerCase();
  return m.startsWith("video/");
}

/** Watermarked WebP for approved submission public preview (raster or video placeholder). */
export async function renderSubmissionPublicPreviewWatermarked(absPath: string, mime?: string): Promise<Buffer> {
  if (isVideoSubmissionMaster(absPath, mime)) {
    const w = PUBLIC_PREVIEW_MAX_PX;
    const h = Math.round((w * 5) / 4);
    const base = await sharp({
      create: {
        width: w,
        height: h,
        channels: 3,
        background: { r: 22, g: 22, b: 24 },
      },
    })
      .png()
      .toBuffer();
    const caption = Buffer.from(
      `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <text x="${Math.round(w / 2)}" y="${h - 36}" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="600"
    text-anchor="middle" fill="rgba(246,244,240,0.45)">Motion</text>
</svg>`,
      "utf8",
    );
    return sharp(base)
      .composite([
        { input: watermarkSvg(w, h, "public"), blend: "over" },
        { input: caption, blend: "over" },
      ])
      .webp({ quality: PUBLIC_PREVIEW_WEBP_QUALITY, effort: 4 })
      .toBuffer();
  }
  return renderCatalogPublicPreviewWatermarked(absPath);
}

/** Logged-out PDP / crawlers: low-res + stronger watermark (what may leak to image search). */
export async function renderCatalogPublicPreviewWatermarked(absPath: string): Promise<Buffer> {
  const resized = await sharp(absPath)
    .rotate()
    .resize(PUBLIC_PREVIEW_MAX_PX, PUBLIC_PREVIEW_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width ?? PUBLIC_PREVIEW_MAX_PX;
  const h = meta.height ?? PUBLIC_PREVIEW_MAX_PX;

  return sharp(resized)
    .composite([{ input: watermarkSvg(w, h, "public"), blend: "over" }])
    .webp({ quality: PUBLIC_PREVIEW_WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

/** Demo session (or future auth): larger watermarked preview — not served without session cookie. */
export async function renderCatalogVaultPreviewWatermarked(absPath: string): Promise<Buffer> {
  const resized = await sharp(absPath)
    .rotate()
    .resize(VAULT_PREVIEW_MAX_PX, VAULT_PREVIEW_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width ?? VAULT_PREVIEW_MAX_PX;
  const h = meta.height ?? VAULT_PREVIEW_MAX_PX;

  return sharp(resized)
    .composite([{ input: watermarkSvg(w, h, "vault"), blend: "over" }])
    .webp({ quality: VAULT_PREVIEW_WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

async function renderVideoImmersivePlaceholderWatermarked(
  width: number,
  height: number,
  webpQuality: number,
): Promise<Buffer> {
  const w = width;
  const h = height;
  const base = await sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: { r: 22, g: 22, b: 24 },
    },
  })
    .png()
    .toBuffer();
  const caption = Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <text x="${Math.round(w / 2)}" y="${h - 36}" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="600"
    text-anchor="middle" fill="rgba(246,244,240,0.45)">Motion</text>
</svg>`,
    "utf8",
  );
  return sharp(base)
    .composite([
      { input: watermarkSvg(w, h, "vault"), blend: "over" },
      { input: caption, blend: "over" },
    ])
    .webp({ quality: webpQuality, effort: 4 })
    .toBuffer();
}

/**
 * Owner-only mobile immersive tiers: watermarked WebP derivatives (never raw master).
 * ISO 27001 A.9.2.1 (§4) / A.13.1.3 (§6)
 * KO: 모바일 몰입 감상용으로 해상도 단계만 달리 하되, 항상 워터마크 파생만 반환합니다.
 * JA: モバイル没入鑑賞向けに解像度段階のみ変え、常に透かし入り派生のみを返します。
 * EN: Tiered resolution for mobile immersive viewing; always returns watermarked derivatives only.
 */
export async function renderSubmissionImmersiveOwnerPreview(
  absPath: string,
  mime: string | undefined,
  tier: "fit" | "zoom",
): Promise<Buffer> {
  if (isVideoSubmissionMaster(absPath, mime)) {
    if (tier === "zoom") {
      const w = VAULT_PREVIEW_MAX_PX;
      const h = Math.round((w * 5) / 4);
      return renderVideoImmersivePlaceholderWatermarked(w, h, VAULT_PREVIEW_WEBP_QUALITY);
    }
    const w = IMMERSIVE_FIT_MAX_PX;
    const h = Math.round((w * 5) / 4);
    return renderVideoImmersivePlaceholderWatermarked(w, h, IMMERSIVE_FIT_WEBP_QUALITY);
  }

  if (tier === "zoom") {
    return renderCatalogVaultPreviewWatermarked(absPath);
  }

  const resized = await sharp(absPath)
    .rotate()
    .resize(IMMERSIVE_FIT_MAX_PX, IMMERSIVE_FIT_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width ?? IMMERSIVE_FIT_MAX_PX;
  const h = meta.height ?? IMMERSIVE_FIT_MAX_PX;

  return sharp(resized)
    .composite([{ input: watermarkSvg(w, h, "vault"), blend: "over" }])
    .webp({ quality: IMMERSIVE_FIT_WEBP_QUALITY, effort: 4 })
    .toBuffer();
}
