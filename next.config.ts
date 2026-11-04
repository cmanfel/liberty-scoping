import type { NextConfig } from "next";

const longCache = [
  {
    key: "Cache-Control",
    value: "public, max-age=604800, stale-while-revalidate=86400",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep the Firestore/protobuf stack out of the server bundle. When bundled and
  // minified, protobuf's \`Long\` class is renamed and proto3-json-serializer
  // (which matches on constructor.name === "Long") throws "toProto3JSON: don't
  // know how to convert value N" for every integer write over the REST transport.
  serverExternalPackages: [
    "@google-cloud/firestore",
    "google-gax",
    "google-auth-library",
    "proto3-json-serializer",
    "protobufjs",
    "long",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/images/:path*", headers: longCache },
      { source: "/logo/:path*", headers: longCache },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
