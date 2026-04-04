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
  const fontSize = tier === "public" ? "40" : "34";
  const patW = tier === "public" ? "200" : "220";
  const patH = tier === "public" ? "150" : "180";
  const tx = tier === "public" ? "100" : "110";
  const ty = tier === "public" ? "88" : "96";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="opusWm" width="${patW}" height="${patH}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30 ${cx} ${cy})">
      <text x="${tx}" y="${ty}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="600"
        text-anchor="middle" dominant-baseline="middle" fill="rgba(222,184,146,${fillA})" stroke="rgba(0,0,0,${strokeA})" stroke-width="0.6">OPUS</text>
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
