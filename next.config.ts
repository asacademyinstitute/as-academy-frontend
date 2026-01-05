import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://asacademy.site',
    NEXT_PUBLIC_SITE_NAME: 'AS Academy',
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
};

export default nextConfig;
