import type { MetadataRoute } from "next";

/**
 * Discourage indexing of catalog raster URLs (Google Images follows the same crawlers).
 * KO: 이미지 전용 URL·정적 원본 경로는 disallow + 응답 X-Robots-Tag와 함께 씁니다.
 * JA: 画像URL・静的オリジンは disallow とレスポンスの X-Robots-Tag を併用します。
 * EN: Pair disallow rules with X-Robots-Tag on image responses; not a hard DRM boundary.
 *
 * PR-17 also publishes `/sitemap.xml` (Next's native sitemap route) and
 * surfaces it here so well-behaved crawlers discover it without
 * relying on Search Console submission.
 */
const SITE_URL = (
  process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/api/catalog-image/", "/local-artworks/", "/sample-artworks/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
