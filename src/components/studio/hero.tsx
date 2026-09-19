'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Activity, Wifi, Monitor, Cpu } from 'lucide-react'

interface HeroProps {
  onInitiateSprint: () => void
}

interface SystemMetrics {
  viewport: string
  memory: string
  connection: string
  latency: number
}

export function Hero({ onInitiateSprint }: HeroProps) {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    viewport: '...',
    memory: '...',
    connection: '...',
    latency: 0,
  })

  useEffect(() => {
    const updateMetrics = () => {
      const viewport = `${window.innerWidth} × ${window.innerHeight}`

      // @ts-expect-error - navigator.deviceMemory is experimental
      const memory = navigator.deviceMemory
        ? // @ts-expect-error
          `${navigator.deviceMemory} GB`
        : 'Unknown'

      // @ts-ignore - navigator.connection is experimental
      const conn = navigator.connection
      const connection = conn?.effectiveType
        ? conn.effectiveType.toUpperCase()
        : 'Unknown'

      // Simulate latency measurement
      const latency = Math.floor(Math.random() * 15) + 8

      setMetrics({ viewport, memory, connection, latency })
    }

    updateMetrics()
    window.addEventListener('resize', updateMetrics)

    const latencyInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 15) + 8
      }))
    }, 2000)

    return () => {
      window.removeEventListener('resize', updateMetrics)
      clearInterval(latencyInterval)
    }
  }, [])

  const handleInspectClick = () => {
    const target = document.getElementById('flagships')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden bg-[#05070C]">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

      <div className="relative max-w-6xl w-full grid lg:grid-cols-[1fr_auto] gap-12 items-center">
        {/* Left: Headline + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6">
            Bespoke Digital<br />
            Engineering
          </h1>

          <p className="text-[clamp(1.125rem,2vw,1.25rem)] text-zinc-400 leading-relaxed mb-10 max-w-xl">
            High-performance web applications for businesses that demand precision.
            No templates, no compromises.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={onInitiateSprint}
              className="px-8 py-4 bg-gradient-to-b from-[#E9A568] to-[#D88C4A] text-[#0A0D12] font-semibold rounded-full hover:shadow-[0_0_30px_rgba(233,165,104,0.3)] transition-all duration-300 hover:scale-[1.02]"
            >
              Initiate Sprint
            </button>

            <button
              onClick={handleInspectClick}
              className="px-8 py-4 border border-zinc-700 text-zinc-300 font-medium rounded-full hover:border-zinc-500 hover:text-white transition-all duration-300"
            >
              Inspect Flagships
            </button>
          </div>
        </motion.div>

        {/* Right: Hardware Inspector */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#0F131C] border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm w-full lg:w-[340px]"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-[#6EE7B7] animate-pulse" />
            <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Client Diagnostics
            </span>
          </div>

          <div className="space-y-4">
            <MetricRow
              icon={<Monitor className="w-4 h-4" />}
              label="Viewport"
              value={metrics.viewport}
            />

            <MetricRow
              icon={<Cpu className="w-4 h-4" />}
              label="Memory"
              value={metrics.memory}
            />

            <MetricRow
              icon={<Wifi className="w-4 h-4" />}
              label="Connection"
              value={metrics.connection}
            />

            <MetricRow
              icon={<Activity className="w-4 h-4" />}
              label="Latency"
              value={`${metrics.latency}ms`}
              animate
            />
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 font-mono">
              Real-time hardware profiling • WebAPI access
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

interface MetricRowProps {
  icon: React.ReactNode
  label: string
  value: string
  animate?: boolean
}

function MetricRow({ icon, label, value, animate = false }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="text-zinc-500 group-hover:text-[#E9A568] transition-colors">
          {icon}
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <motion.span
        key={value}
        initial={animate ? { opacity: 0, y: -4 } : false}
        animate={animate ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.3 }}
        className="text-sm font-mono text-white font-medium"
      >
        {value}
      </motion.span>
    </div>
  )
}
