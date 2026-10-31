import type { NextConfig } from 'next';

// GitHub Pages serves this repo under /hvnf-studios/; Vercel serves it at the
// root of its own domain. Vercel sets VERCEL=1 during its builds.
const basePath = process.env.NODE_ENV === 'production' && !process.env.VERCEL ? '/hvnf-studios' : '';

const config: NextConfig = {
  output: 'export',
  basePath,
  // The same prefix, inlined at build time, for the one link that can't use
  // next/link: the 404's way home (see app/not-found.tsx).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: true,
  reactStrictMode: true,

  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'motion', '@react-three/fiber', '@react-three/drei'],
  },

  turbopack: {},

  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    });
    return config;
  },
};

export default config;
