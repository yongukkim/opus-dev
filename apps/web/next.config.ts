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
  transpilePackages: ["@opus/ui", "@opus/api"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/local-artworks/:path*", headers: catalogImageRobotsHeaders },
      { source: "/sample-artworks/:path*", headers: catalogImageRobotsHeaders },
    ];
  },
};

export default nextConfig;
