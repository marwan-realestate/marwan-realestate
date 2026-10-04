import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "bcryptjs"],
  poweredByHeader: false,
};

export default nextConfig;
