import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/octav/:path*",
        destination: "https://api.octav.fi/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
