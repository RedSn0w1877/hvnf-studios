"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { setHeavyActive, useDeviceProfile, useMedia, usePageVisible } from "@/lib/perf";
import { pillarStore } from "@/lib/stage-store";
import { Reveal, SectionHead, SETTLE, TiltCard, WordReveal } from "./kit";

/**
 * The work: three builds orbiting a column of particles, each rising around it
 * and dissolving at the top as the next one climbs into its place.
 *
 * Performance contract:
 *  - exactly ONE embed exists at a time (whichever build is nearest the front);
 *    every other card shows a drawn poster. Three WebGL sites at once would
 *    stall the page.
 *  - the orbit is transform and opacity only, written straight to style from a
 *    single ticker callback. No React state per frame, no layout reads beyond
 *    one rect, so the compositor does all of it.
 *  - the pillar lives in the page's one shared canvas (see stage.tsx) and stops
 *    drawing entirely once this section is off screen.
 *  - phones, weak CPUs, narrow windows and reduced-motion get a plain stack
 *    instead: same content, no orbit, no embeds on lite devices.
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

function Poster({ build, mounted }: { build: Build; mounted: boolean }) {
  return (
    <>
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
    </>
  );
}

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
      <div aria-hidden className={`absolute inset-0 transition-opacity duration-700 ${loaded ? "opacity-0" : "opacity-100"}`}>
        <Poster build={build} mounted={mounted} />
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

/** The text half of a build, shared by both layouts. */
function Details({ build, compact }: { build: Build; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-sm" style={{ color: build.accent }}>{build.index}</span>
        <span className="eyebrow">{build.sector}</span>
      </div>

      <h3 className={`mt-4 font-semibold tracking-[-0.02em] text-bone ${compact ? "text-[1.6rem]" : "mt-5 text-[clamp(1.9rem,3.6vw,2.9rem)]"}`}>
        {build.title}
      </h3>
      <p className={`mt-3 max-w-md leading-relaxed text-ash ${compact ? "text-[14px]" : "mt-4 text-[15px]"}`}>{build.blurb}</p>

      <ul className="mt-5 flex flex-wrap gap-2">
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
        className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-rule-strong pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-bone transition-colors hover:border-ember hover:text-ember"
      >
        Open the live build
        <ArrowUpRight size={14} aria-hidden />
      </a>
    </div>
  );
}

/* ---- the orbit ---------------------------------------------------------- */

/**
 * Each card's own progress runs 0 → 1 as it climbs the column. The schedule is
 * tuned so the first card is already a third of the way up when the stage pins
 * and the last has not quite left when it unpins — otherwise you scroll into an
 * empty screen at one end or the other.
 */
const LEAD = 0.3;
const SPAN = 1.86;
/** Spacing between cards, in the same units. Below ~0.7 they overlap on screen. */
const GAP = 0.62;
/** A little over half a turn: enough to read as an orbit, not so much that a
 *  card spends the whole time facing away. */
const SWEEP = Math.PI * 1.28;
const RADIUS = 340;
const RISE = 0.82;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (edge0: number, edge1: number, v: number) => {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function Orbit({ liveId, onLive }: { liveId: string | null; onLive: (id: string | null) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const front = useRef<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const trackEl = track.current;
      const stageEl = stage.current;
      if (!trackEl || !stageEl) return;

      const rect = trackEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = rect.height - vh;
      const p = span > 0 ? clamp01(-rect.top / span) : 0;

      // The pillar only exists while this section owns the screen.
      pillarStore.value = Math.min(clamp01(1 - rect.top / vh), clamp01(rect.bottom / vh));

      const stageH = stageEl.clientHeight;
      let bestFace = -2;
      let bestId: string | null = null;

      for (let i = 0; i < BUILDS.length; i++) {
        const el = cards.current[i];
        if (!el) continue;

        const t = SPAN * p + LEAD - i * GAP;
        if (t < -0.15 || t > 1.15) {
          el.style.visibility = "hidden";
          continue;
        }

        const a = (t - 0.5) * SWEEP;
        const face = Math.cos(a);
        const edge = smooth(0, 0.16, t) * (1 - smooth(0.84, 1, t));
        const opacity = edge * (0.12 + 0.88 * Math.max(0, face));

        el.style.visibility = opacity < 0.012 ? "hidden" : "visible";
        el.style.transform = `translate3d(${(Math.sin(a) * RADIUS).toFixed(2)}px, ${((0.5 - t) * RISE * stageH).toFixed(2)}px, ${((face - 1) * RADIUS).toFixed(2)}px)`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(100 + Math.round(face * 50));
        // Only the card you can actually read should catch the pointer.
        el.style.pointerEvents = opacity > 0.55 ? "auto" : "none";

        if (edge > 0.5 && face > bestFace) {
          bestFace = face;
          bestId = BUILDS[i].id;
        }
      }

      // React only hears about the front card when it actually changes.
      if (bestId !== front.current) {
        front.current = bestId;
        onLive(bestId);
      }
    };

    gsap.ticker.add(tick);
    tick();
    return () => {
      gsap.ticker.remove(tick);
      pillarStore.value = 0;
    };
  }, [onLive]);

  return (
    <div ref={track} className="relative h-[340vh]">
      <div ref={stage} className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0" style={{ perspective: "1150px" }}>
          {BUILDS.map((build, i) => (
            <div key={build.id} className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
              <article
                ref={(el) => {
                  cards.current[i] = el;
                }}
                style={{ visibility: "hidden", willChange: "transform, opacity" }}
                className="w-[min(92vw,31rem)]"
              >
                <div className="overflow-hidden rounded-xl border border-rule bg-carbon/70 shadow-[0_50px_120px_-60px_rgba(0,0,0,1)] backdrop-blur-[2px]">
                  <div className="relative aspect-[16/10] w-full [container-type:inline-size]">
                    <Frame build={build} live={liveId === build.id} />
                  </div>
                  <div className="p-6 md:p-7">
                    <Details build={build} compact />
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- the plain stack ---------------------------------------------------- */

function Stack({ liveId, lite }: { liveId: string | null; lite: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-20 flex flex-col gap-20 md:gap-28">
      {BUILDS.map((build) => (
        <motion.article
          key={build.id}
          initial={reduce ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -14% 0px" }}
          transition={{ duration: 0.9, ease: SETTLE }}
          className="grid gap-8 border-t border-rule pt-8 md:grid-cols-[1fr_1.05fr] md:items-center md:gap-12"
        >
          <Details build={build} />
          <TiltCard className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-rule shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] [container-type:inline-size]">
            <Frame build={build} live={!lite && liveId === build.id} />
          </TiltCard>
        </motion.article>
      ))}
    </div>
  );
}

export function Work() {
  const { lite } = useDeviceProfile();
  const visible = usePageVisible();
  const reduce = useReducedMotion();
  // The orbit needs width to swing through and motion permission to run at all.
  const roomy = useMedia("(min-width: 1024px)");
  const orbiting = roomy && !lite && !reduce;

  const [liveId, setLiveId] = useState<string | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  // The stack picks its own live card the old way: whichever crosses the middle.
  useEffect(() => {
    if (orbiting || lite || !visible) return;
    const steps = stackRef.current?.querySelectorAll<HTMLElement>("article");
    if (!steps?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let best: string | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            best = BUILDS[Array.from(steps).indexOf(entry.target as HTMLElement)]?.id ?? null;
          }
        }
        if (best) setLiveId(best);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.3, 0.6] },
    );
    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [orbiting, lite, visible]);

  return (
    <section id="work" className="relative py-28 md:py-36">
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
                : "Keep scrolling and each one climbs past. Whichever is facing you is the real site, loaded and running right here."}
            </p>
          </Reveal>
        </div>
      </div>

      {orbiting ? (
        <Orbit liveId={visible ? liveId : null} onLive={setLiveId} />
      ) : (
        <div ref={stackRef} className="shell">
          <Stack liveId={visible ? liveId : null} lite={lite} />
        </div>
      )}
    </section>
  );
}
