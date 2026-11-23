import type { NextConfig } from 'next';

// GitHub Pages serves this repo under /hvnf-studios/; Vercel serves it at the
// root of its own domain. Vercel sets VERCEL=1 during its builds.
const basePath = process.env.NODE_ENV === 'production' && !process.env.VERCEL ? '/hvnf-studios' : '';

// Two builds share this repo. The GitHub Pages mirror is a static export (no
// server, so no API). Vercel runs a real server build, which is what lets
// POST /api/request exist. HVNF_SERVER=1 turns the server build on elsewhere
// (for `next dev` with the API, or a self-hosted `next start`).
const hasServer = Boolean(process.env.VERCEL) || process.env.HVNF_SERVER === '1';

// A route handler can't be part of a static export (the build refuses it). So
// the API's file is named route.server.ts, and only the server build counts
// "server.ts" as a page extension: the static build never sees it as a route.
const pageExtensions = hasServer ? ['tsx', 'ts', 'jsx', 'js', 'server.ts'] : ['tsx', 'ts', 'jsx', 'js'];

const config: NextConfig = {
  ...(hasServer ? {} : { output: 'export' as const }),
  pageExtensions,
  basePath,
  // The same prefix, inlined at build time, for the one link that can't use
  // next/link: the 404's way home (see app/not-found.tsx).
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_REQUEST_API: hasServer ? '1' : '' },
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
    // Errors stay: the request route logs one short line when an email fails.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
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
