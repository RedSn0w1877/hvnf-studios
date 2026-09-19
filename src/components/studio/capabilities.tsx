'use client';

import { Zap, Box, Shield } from 'lucide-react';
import { motion } from 'motion/react';

const capabilities = [
  {
    icon: Zap,
    title: 'Sub-Second Edge Infrastructure',
    description: 'Vercel Edge Functions eliminate cold starts. Zero bloat bundles, aggressive code splitting, and font subsetting mean first paint under 400ms on 3G.',
    metrics: ['<400ms FCP', 'Edge-deployed', '100 Lighthouse'],
    span: 'md:col-span-2',
  },
  {
    icon: Box,
    title: 'Custom 3D & WebGL Systems',
    description: 'Lightweight shaders and instanced geometry, not heavy libraries. Exploded product views, kinetic typography, scroll-scrubbed sequences.',
    metrics: ['<50kb gzipped', 'GPU-accelerated', '60fps locked'],
    span: 'md:col-span-1',
  },
  {
    icon: Shield,
    title: 'Zero-Headache Managed Care',
    description: 'Hosting, SSL, uptime monitoring, monthly SEO reports. Text-to-update support means you never touch code. We handle deploys, rollbacks, and performance audits.',
    metrics: ['99.9% uptime SLA', '1hr response', 'Monthly reports'],
    span: 'md:col-span-3',
  },
];

export function Capabilities() {
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Built on first principles,
            <br />
            <span className="text-zinc-400">not boilerplate.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-[#0A0D12] p-8 transition-all duration-300 hover:border-zinc-700 ${capability.span}`}
            >
              {/* Subtle gradient overlay on hover */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/0 via-zinc-800/0 to-zinc-800/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center justify-center rounded-full bg-zinc-900/50 p-3 ring-1 ring-zinc-800">
                  <capability.icon className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
                </div>

                <h3 className="mb-3 text-xl font-semibold tracking-tight text-white">
                  {capability.title}
                </h3>

                <p className="mb-6 text-base leading-relaxed text-zinc-400">
                  {capability.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {capability.metrics.map((metric) => (
                    <div
                      key={metric}
                      className="rounded-full border border-zinc-800 bg-zinc-900/30 px-3 py-1 text-xs font-medium text-zinc-500"
                    >
                      {metric}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hairline accent on hover */}
              <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
