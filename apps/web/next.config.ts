import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** Tell crawlers not to index artwork binaries under `public/` (mirrors `robots.txt` disallow). */
const catalogImageRobotsHeaders = [{ key: "X-Robots-Tag", value: "noindex, noimageindex" }];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Allow LAN preview host to receive dev HMR updates.
  allowedDevOrigins: ["172.30.1.53"],
  transpilePackages: ["@opus/ui", "@opus/api"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/local-artworks/:path*", headers: catalogImageRobotsHeaders },
      { source: "/sample-artworks/:path*", headers: catalogImageRobotsHeaders },
    ];
  },
  /**
   * Permanent redirect for the retired `/tokushoho` placeholder page
   * (superseded by the rendered `/legal/specified-commercial` route in #12).
   * Kept as a safety net — no known external references, but guards old
   * bookmarks / cached header links.
   */
  async redirects() {
    return [
      {
        source: "/:locale(ko|ja|en)/tokushoho",
        destination: "/:locale/legal/specified-commercial",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
