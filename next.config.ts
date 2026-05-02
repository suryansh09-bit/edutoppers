import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.pw.live" },
      { protocol: "https", hostname: "d2bps9p1kiy4ka.cloudfront.net" },
      { protocol: "https", hostname: "d1oi7t5trwfj5d.cloudfront.net" },
      { protocol: "https", hostname: "d26oc3sg82pgk3.cloudfront.net" },
      { protocol: "https", hostname: "cdn.pw.live" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Range, Accept" },
          { key: "Access-Control-Expose-Headers", value: "Content-Length, Content-Range, Accept-Ranges" },
        ],
      },
    ];
  },
};

export default nextConfig;
