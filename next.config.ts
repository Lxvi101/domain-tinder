import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.domaintinder.com" }],
        destination: "https://domaintinder.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
