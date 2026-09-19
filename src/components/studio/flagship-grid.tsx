"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useState, useRef, MouseEvent } from "react";

interface FlagshipProject {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  specs: {
    lighthouse: string;
    bundle: string;
    features: string;
  };
  gradient: string;
}

const flagships: FlagshipProject[] = [
  {
    id: "kroma",
    title: "KROMA LABS",
    subtitle: "Industrial Mechanical Engineering & CNC Acoustic Soundboard",
    href: "/kroma",
    specs: {
      lighthouse: "100/100/100/100",
      bundle: "94.2 kB",
      features: "3D CNC visualization, real-time acoustic waveforms",
    },
    gradient: "from-zinc-900 via-neutral-800 to-stone-900",
  },
  {
    id: "apex",
    title: "APEX DYNAMICS",
    subtitle: "Kinetic Footwear Lab & Real-Time Stride Telemetry HUD",
    href: "/apex",
    specs: {
      lighthouse: "100/100/100/100",
      bundle: "102.8 kB",
      features: "WebGL stride tracker, GPU particle emissions",
    },
    gradient: "from-slate-900 via-blue-950 to-cyan-950",
  },
  {
    id: "aetheria",
    title: "AETHERIA BOTANICALS",
    subtitle: "Cryogenic Luxury Extraction & Olfactory Blender",
    href: "/aetheria",
    specs: {
      lighthouse: "100/100/100/100",
      bundle: "88.4 kB",
      features: "Three.js vapor particles, scroll-bound molecule reveal",
    },
    gradient: "from-emerald-950 via-teal-900 to-cyan-950",
  },
];

function FlagshipCard({ project }: { project: FlagshipProject }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Magnetic hover effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7.5, -7.5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7.5, 7.5]), springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) / (rect.width / 2);
    const distanceY = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(distanceX);
    mouseY.set(distanceY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative"
    >
      <Link href={project.href} className="block">
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${project.gradient} border border-white/5 p-8 transition-all duration-500 group-hover:border-white/10 group-hover:shadow-2xl group-hover:shadow-black/50`}
        >
          {/* Content */}
          <div className="relative z-10" style={{ transform: "translateZ(50px)" }}>
            <motion.h3
              className="text-2xl font-bold tracking-tight text-white mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {project.title}
            </motion.h3>
            <motion.p
              className="text-sm text-zinc-400 leading-relaxed mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {project.subtitle}
            </motion.p>

            {/* Specs reveal */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                height: isHovered ? "auto" : 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Lighthouse</span>
                  <span className="font-mono text-emerald-400">{project.specs.lighthouse}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Bundle</span>
                  <span className="font-mono text-cyan-400">{project.specs.bundle}</span>
                </div>
                <div className="text-xs text-zinc-500 pt-2">
                  <span className="text-zinc-400">{project.specs.features}</span>
                </div>
              </div>
            </motion.div>

            {/* View arrow */}
            <motion.div
              className="mt-6 flex items-center gap-2 text-sm font-medium text-white/70 group-hover:text-white"
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ duration: 0.2 }}
            >
              View Project
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>

          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ transform: "translateZ(25px)" }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

export function FlagshipGrid() {
  return (
    <section className="w-full px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Flagship Builds
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl">
            High-performance showcases proving technical range — WebGL, real-time telemetry, and
            scroll-choreographed 3D.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flagships.map((project) => (
            <FlagshipCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
