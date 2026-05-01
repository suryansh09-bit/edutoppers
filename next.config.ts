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
};

export default nextConfig;
