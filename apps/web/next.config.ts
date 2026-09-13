import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@signal/db",
    "@signal/core",
    "@signal/ui",
    "@signal/jobs",
    "@signal/contract",
    "@signal/widget-core",
  ],
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
