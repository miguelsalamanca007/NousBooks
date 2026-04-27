import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 15 blocks cross-origin dev resources by default. Allow our LAN IP so
  // the dev server's HMR works when the app is opened from another device.
  allowedDevOrigins: ["192.168.0.100"],
  images: {
    // Google Books serves thumbnails from a couple of hosts. We allow them
    // explicitly so next/image can optimize and proxy them.
    remotePatterns: [
      { protocol: "http", hostname: "books.google.com" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "http", hostname: "books.googleusercontent.com" },
      { protocol: "https", hostname: "books.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
