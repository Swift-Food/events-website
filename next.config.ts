import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "swifts3images.s3.eu-north-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
