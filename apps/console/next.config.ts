import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // nodemailer is loaded dynamically at runtime (not statically imported) so Next standalone
  // does not bundle it automatically. bundlePagesRouterDependencies + serverExternalPackages
  // forces it into the standalone output.
  experimental: {
    serverComponentsExternalPackages: ["nodemailer"],
  },
};

export default nextConfig;
