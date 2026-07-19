import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        destination: "https://dinevio.de/:path*",
        has: [
          {
            type: "host",
            value: "www.dinevio.de"
          }
        ],
        permanent: true,
        source: "/:path*"
      }
    ];
  }
};

export default nextConfig;
