"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { setHeavyActive, useDeviceProfile, usePageVisible } from "@/lib/perf";
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
      "A shop for machined aluminium keyboards. The board is built in 3D in the browser, comes apart layer by layer as you scroll, and every switch plays its own sound.",
    built: ["3D in the browser", "Scroll-driven motion", "Real switch sounds"],
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
      "A shop for a carbon-plated trail running shoe. The shoe is drawn in code and splits into its five layers as you scroll, next to charts you can drag through yourself.",
    built: ["Shoe drawn in code", "Airflow particles", "Charts you can drag"],
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
      "A shop for slow-made botanical perfume. The glass bottle catches the light as it turns, the liquid takes the colour of the scent you mix, and the story moves sideways as you scroll.",
    built: ["Hand-written graphics", "Glass that refracts", "Sideways scroll"],
    href: "https://redsn0w1877.github.io/aetheria-botanicals/",
    poster: "from-[#1d2a20] via-[#14201a] to-[#0b1210]",
    accent: "#A88243",
  },
];

function Frame({ build, live }: { build: Build; live: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!live) return;
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
        className={`absolute inset-0 transition-opacity duration-700 ${loaded ? "opacity-0" : "opacity-100"}`}
      >
        <svg viewBox="0 0 480 300" className="h-full w-full" fill="none">
          <g stroke={build.accent} strokeWidth="1.2">
            {build.id === "kroma" ? (
              <g transform="translate(88 65) rotate(-12 150 85)">
                <rect width="300" height="150" rx="12" fill="#191b1e" />
                <rect x="10" y="10" width="280" height="130" rx="7" opacity="0.4" />
                {Array.from({ length: 48 }, (_, i) => (
                  <rect key={i} x={20 + (i % 12) * 22} y={20 + Math.floor(i / 12) * 24} width="18" height="19" rx="3" opacity={i % 12 === 0 ? 1 : 0.4} />
                ))}
                <rect x="80" y="118" width="134" height="13" rx="3" />
              </g>
            ) : build.id === "apex" ? (
              <g transform="translate(60 50)">
                <path d="M20 133 Q55 122 91 61 L143 76 Q178 72 199 102 L298 135 Q338 144 345 164 L31 170 Q9 166 20 133Z" fill="#20251f" />
                <path d="M19 167 Q142 184 345 163 L336 183 Q152 210 25 188Z" fill="#ccff00" fillOpacity="0.18" />
                <path d="M118 90 182 110 M109 102 177 122 M100 115 169 135 M52 145 Q160 155 308 161" opacity="0.65" />
                <path d="M4 109 H57 M272 104 H357 M10 208 H305" opacity="0.3" />
              </g>
            ) : (
              <g transform="translate(170 35)">
                <rect x="35" width="70" height="36" rx="7" fill="#a88243" fillOpacity="0.25" />
                <path d="M38 38 V61 Q6 73 8 103 L14 220 Q70 241 126 220 L132 103 Q134 73 102 61 V38Z" fill="#c6b88e" fillOpacity="0.1" />
                <path d="M20 148 Q70 139 120 148 L116 212 Q70 225 24 212Z" fill="#a88243" fillOpacity="0.28" />
                {[30, 46, 62, 78, 94, 110].map((x) => <path key={x} d={`M${x} 89 V214`} opacity="0.3" />)}
                <rect x="42" y="108" width="56" height="57" rx="1" fill="#d8cfb4" fillOpacity="0.15" />
              </g>
            )}
          </g>
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
          <span className="h-px w-2/3" style={{ background: build.accent, opacity: 0.55 }} />
          <span className="h-px w-1/3 bg-white/15" />
          <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            {mounted ? "Loading live build…" : "Portfolio concept — explore the build"}
          </span>
        </div>
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
          style={{ width: 1440, height: 900, transform: "scale(calc(100cqw / 1440px))" }}
        />
      ) : null}

      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

      {/*
        Only once the frame has actually loaded — the poster underneath says
        "loading" until then, and claiming both at once would be a lie about which
        one the visitor is looking at.
      */}
      {loaded ? (
        <motion.span
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: SETTLE }}
          className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-rule bg-ink/85 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ash"
        >
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="block h-1.5 w-1.5 rounded-full bg-arc"
          />
          Running live
        </motion.span>
      ) : null}
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
            className="mt-8 inline-flex min-h-11 items-center gap-2 border-b border-rule-strong pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-bone transition-colors hover:border-ember hover:text-ember"
          >
            Open the live build
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </div>

        <TiltCard className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-rule shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] [container-type:inline-size]">
          <Frame key={`${build.id}-${live}`} build={build} live={live} />
        </TiltCard>
      </motion.article>
    </div>
  );
}

export function Work() {
  const section = useRef<HTMLElement>(null);
  const [liveId, setLiveId] = useState<string | null>(null);
  const { lite } = useDeviceProfile();
  const visible = usePageVisible();

  // Only the step crossing the viewport's central band owns an embed.
  useEffect(() => {
    if (lite || !visible) return;
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
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });
        setLiveId(best);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.1, 0.3, 0.6] },
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [lite, visible]);

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
                ? "Each build below is live on the web. Open one and try it — the 3D and the scrolling are all real."
                : "Whichever build is in the middle of your screen is the real site, loaded and running right here. Open any of them and try it yourself."}
            </p>
          </Reveal>
        </div>

        <div className="mt-20 flex flex-col gap-20 md:gap-28">
          {BUILDS.map((build, i) => (
            <Step key={build.id} build={build} position={i} live={!lite && visible && liveId === build.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
