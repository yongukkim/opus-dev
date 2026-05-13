import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Turbopack `root` must be an absolute path (see next.config `turbopack.root`).
 * - In Docker/pnpm hoisted layouts, `next` lives under the repo root (`/app/node_modules`);
 *   the root must include that directory or resolution fails.
 * - Do not rely only on `import.meta.url`: Next may load a compiled copy of this config.
 */
function turbopackRootForNext(): string {
  const cwd = path.resolve(process.cwd());
  let webDir: string;
  if (fs.existsSync(path.join(cwd, "next.config.ts"))) {
    webDir = cwd;
  } else if (fs.existsSync(path.join(cwd, "apps", "web", "next.config.ts"))) {
    webDir = path.resolve(cwd, "apps", "web");
  } else {
    webDir = path.dirname(fileURLToPath(import.meta.url));
  }

  const repoRoot = path.resolve(webDir, "..", "..");
  if (
    fs.existsSync(path.join(repoRoot, "pnpm-workspace.yaml")) &&
    fs.existsSync(path.join(repoRoot, "pnpm-lock.yaml"))
  ) {
    return repoRoot;
  }
  return webDir;
}

const TURBOPACK_ROOT = turbopackRootForNext();

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
  turbopack: {
    root: TURBOPACK_ROOT,
  },
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
