import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Development only: lets a phone on the same Wi-Fi open the app at http://192.168.1.135:3000
  allowedDevOrigins: ["192.168.1.135"],
  images: {
    // Allow item photos from our Supabase Storage bucket only
    remotePatterns: [
      new URL("https://yxwgbuscdqjekrptducf.supabase.co/storage/v1/object/public/item-photos/**"),
    ],
  },
  partialPrefetching: true,
  turbopack: {
    // A stray package-lock.json in the user folder made Next.js guess the wrong project root.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
