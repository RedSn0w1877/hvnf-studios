"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { setHeavyActive, useDeviceProfile } from "@/lib/perf";
import { Reveal, SectionHead, SETTLE, TiltCard, WordReveal } from "./kit";

/**
 * The work: three builds descending the page like a staircase, each a live window
 * onto the real deployed site.
 *
 * Performance contract:
 *  - exactly ONE embed exists at a time (whichever step owns the viewport middle);
 *    every other step shows a drawn poster. Three WebGL sites at once would stall
 *    the page.
 *  - an embed mounts only after its step settles, so scrolling straight past never
 *    starts a load, and it unmounts when another step takes over, freeing that
 *    site's GL context and timers.
 *  - phones, weak CPUs and data-saver never mount one at all: poster plus a link,
 *    which saves a multi-megabyte load on the connections least able to afford it.
 *  - while an embed is live the shared canvas is told to idle (setHeavyActive).
 */

type Build = {
  id: string;
  index: string;
  title: string;
  sector: string;
  blurb: string;
  built: readonly string[];
  href: string;
  poster: string;
  accent: string;
};

const BUILDS: readonly Build[] = [
  {
    id: "kroma",
    index: "01",
    title: "Kroma Labs",
    sector: "Machined hardware",
    blurb:
      "A billet aluminium keyboard shop. The board is modelled in the browser, comes apart layer by layer as you scroll, and every switch sounds itself through the Web Audio API.",
    built: ["React Three Fiber", "ScrollTrigger", "Web Audio"],
    href: "https://redsn0w1877.github.io/kroma-labs/",
    poster: "from-zinc-900 via-neutral-900 to-stone-950",
    accent: "#E9A568",
  },
  {
    id: "apex",
    index: "02",
    title: "Apex Dynamics",
    sector: "Performance footwear",
    blurb:
      "A carbon-plated trail racer. The shoe is generated in code and pulls apart into its five layers on scroll, beside a drag comparator and stride telemetry you can drag through.",
    built: ["Procedural geometry", "GPU particles", "SVG telemetry"],
    href: "https://redsn0w1877.github.io/apex-dynamics/",
    poster: "from-slate-950 via-zinc-900 to-black",
    accent: "#CCFF00",
  },
  {
    id: "aetheria",
    index: "03",
    title: "Aetheria Botanicals",
    sector: "Slow-extraction perfumery",
    blurb:
      "An editorial perfume atelier. A fluted crystal flacon refracts in real time, the tincture takes the colour of the scent you compose, and the extraction ritual walks sideways as you scroll down.",
    built: ["Custom GLSL", "Physical glass", "Pinned horizontal scroll"],
    href: "https://redsn0w1877.github.io/aetheria-botanicals/",
    poster: "from-[#1d2a20] via-[#14201a] to-[#0b1210]",
    accent: "#A88243",
  },
];

function Frame({ build, live }: { build: Build; live: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!live) {
      setMounted(false);
      setLoaded(false);
      return;
    }
    const id = window.setTimeout(() => setMounted(true), 300);
    return () => window.clearTimeout(id);
  }, [live]);

  useEffect(() => {
    if (!mounted) return;
    setHeavyActive(true);
    return () => setHeavyActive(false);
  }, [mounted]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${build.poster}`}>
      <div
        aria-hidden
        className={`absolute inset-0 flex flex-col justify-end gap-2 p-6 transition-opacity duration-1000 ${loaded ? "opacity-0" : "opacity-100"}`}
      >
        <span className="h-px w-2/3" style={{ background: build.accent, opacity: 0.55 }} />
        <span className="h-px w-1/3 bg-white/15" />
        <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
          {mounted ? "Loading live build…" : "Live build"}
        </span>
      </div>

      {mounted ? (
        <iframe
          src={build.href}
          title={`Live preview of ${build.title}`}
          loading="lazy"
          tabIndex={-1}
          onLoad={() => setLoaded(true)}
          // Rendered at desktop size then scaled, so the preview is the real desktop
          // layout rather than the site's mobile breakpoint.
          className={`pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-[1200ms] ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ width: 1440, height: 900, transform: "scale(0.3333)" }}
        />
      ) : null}

      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
    </div>
  );
}

function Step({ build, position, live }: { build: Build; position: number; live: boolean }) {
  const reduce = useReducedMotion();
  const indent = ["lg:ml-0", "lg:ml-[10%]", "lg:ml-[20%]"][position] ?? "";

  return (
    <div data-step data-step-id={build.id} className={`relative ${indent}`}>
      <motion.article
        initial={reduce ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -14% 0px" }}
        transition={{ duration: 0.9, ease: SETTLE }}
        className="group grid gap-8 border-t border-rule pt-8 md:grid-cols-[1fr_1.05fr] md:items-center md:gap-12"
      >
        <div className="min-w-0">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-sm" style={{ color: build.accent }}>
              {build.index}
            </span>
            <span className="eyebrow">{build.sector}</span>
          </div>

          <h3 className="mt-5 text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold tracking-[-0.02em] text-bone">
            {build.title}
          </h3>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ash">{build.blurb}</p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {build.built.map((tool) => (
              <li key={tool} className="rounded-full border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {tool}
              </li>
            ))}
          </ul>

          <a
            href={build.href}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 border-b border-rule-strong pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-bone transition-colors hover:border-ember hover:text-ember"
          >
            Open the live build
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </div>

        <TiltCard className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-rule shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] [content-visibility:auto]">
          <Frame build={build} live={live} />
        </TiltCard>
      </motion.article>
    </div>
  );
}

export function Work() {
  const section = useRef<HTMLElement>(null);
  const [liveId, setLiveId] = useState<string | null>(null);
  const { lite } = useDeviceProfile();

  // One observer for every step; the most central one owns the single embed.
  useEffect(() => {
    if (lite) {
      setLiveId(null);
      return;
    }
    const steps = section.current?.querySelectorAll<HTMLElement>("[data-step]");
    if (!steps?.length) return;

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.stepId;
          if (id) ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let best: string | null = null;
        let bestRatio = 0.3;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });
        setLiveId(best);
      },
      { threshold: [0, 0.3, 0.6, 0.9] },
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [lite]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Desktop with motion allowed only; phones keep a plain stack.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]", section.current);
        steps.forEach((step, i) => {
          if (i === 0) return;
          gsap.fromTo(
            step,
            { y: 60 * i },
            { y: -40 * i, ease: "none", scrollTrigger: { trigger: step, start: "top bottom", end: "bottom top", scrub: 1 } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="work" className="relative py-28 md:py-36">
      <div className="shell">
        <SectionHead index="01" label="Selected work" />

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2
            aria-label="Three builds, running live."
            className="text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-bone lg:col-span-7"
          >
            <WordReveal text="Three builds, running live." />
          </h2>
          <Reveal className="lg:col-span-5 lg:justify-self-end">
            <p className="max-w-sm text-[15px] leading-relaxed text-ash">
              {lite
                ? "Each build below is deployed and running. Open one and poke at it — the 3D, the scroll work and the interactions are all real."
                : "Every frame below is the real deployed site, embedded and running as you scroll. Open one and poke at it."}
            </p>
          </Reveal>
        </div>

        <div className="mt-20 flex flex-col gap-20 md:gap-28">
          {BUILDS.map((build, i) => (
            <Step key={build.id} build={build} position={i} live={!lite && liveId === build.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
