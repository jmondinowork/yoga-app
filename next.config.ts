import type { NextConfig } from "next";

const r2BaseHostname = process.env.R2_ENDPOINT
  ? new URL(process.env.R2_ENDPOINT).hostname
  : undefined;
const r2Bucket = process.env.R2_BUCKET;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        pathname: "/**",
      },
      // R2 presigned URLs (bucket-prefixed virtual-hosted style)
      ...(r2BaseHostname && r2Bucket
        ? [{ protocol: "https" as const, hostname: `${r2Bucket}.${r2BaseHostname}`, pathname: "/**" }]
        : r2BaseHostname
          ? [{ protocol: "https" as const, hostname: `*.${r2BaseHostname}`, pathname: "/**" }]
          : []),
    ],
  },
  // Stripe webhook needs raw body
  serverExternalPackages: ["stripe"],
};

export default nextConfig;
