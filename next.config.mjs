/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
  },
  images: {
    // Instructors can supply any image URL for course thumbnails, so allow
    // any HTTPS host. (next/image still optimizes & proxies them.)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
