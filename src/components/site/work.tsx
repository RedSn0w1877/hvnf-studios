"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { bus } from "@/lib/bus";
import { setHeavyActive, useDeviceProfile, useMedia, usePageVisible } from "@/lib/perf";
import { CubeMark } from "./cube-mark";
import { RegisteredHeading, SETTLE, TiltCard } from "./kit";

/**
 * The work: three builds orbiting a column of particles, each rising around it
 * and dissolving at the top as the next one climbs into its place.
 *
 * Performance contract:
 *  - exactly ONE embed exists at a time (whichever build is nearest the front);
 *    every other card shows a drawn poster. Three WebGL sites at once would
 *    stall the page. A card that leaves the front lets go of its iframe after a
 *    short grace, so a visited build does not keep running off screen.
 *  - the orbit is transform and opacity only, written straight to style from a
 *    single ticker callback. No React state per frame, no layout reads beyond
 *    one rect, so the compositor does all of it.
 *  - the orbit and the pillar only tick while the track is within a tenth of a
 *    screen of the viewport (one IntersectionObserver), and freeze while the
 *    intake covers the page. No embed loads until the track itself has reached
 *    the screen, so the hero at rest never pays for any of it.
 *  - a hidden tab keeps its embed: the browser already throttles it, and
 *    reloading the whole site on every tab switch would be the expensive part.
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
        <span className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white/75">
          {mounted ? "Loading live build…" : "Portfolio concept — explore the build"}
        </span>
      </div>
    </>
  );
}

/**
 * The preview renders the real site at a "virtual window" sized to the card, so a
 * small card shows the site's phone/tablet layout and a big one shows desktop.
 * Text lands around 70% of its real size at every card size, instead of one
 * fixed 1440px canvas shrinking until it is unreadable.
 */
const PREVIEW_SCALE = 0.7;
/**
 * How long an embed outlives its turn at the front. Long enough that a card
 * swinging past the front and straight back does not reload; short enough that
 * the page is back to zero embeds (and the Stage back to full quality) soon
 * after the orbit moves on.
 */
const EMBED_GRACE_MS = 1200;

/**
 * `hidden` is the tab being in the background. It freezes the embed where it
 * is: nothing new mounts, and the one already running is not let go, so
 * switching tabs and back never reloads the live site.
 */
function Frame({ build, live, hidden }: { build: Build; live: boolean; hidden: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({ w: 1024, h: 640, scale: PREVIEW_SCALE });
  const box = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;
      // Steps of 10px keep the iframe from re-laying-out on every pixel of a resize.
      const w = Math.min(1600, Math.max(360, Math.round(cw / PREVIEW_SCALE / 10) * 10));
      const scale = cw / w;
      setView((v) => (v.w === w && Math.abs(v.h - ch / scale) < 2 ? v : { w, h: Math.round(ch / scale), scale }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!live || hidden) return;
    const id = window.setTimeout(() => setMounted(true), 300);
    return () => window.clearTimeout(id);
  }, [live, hidden]);

  // Off the front: unmount the embed once the grace runs out. Coming back inside
  // the grace clears the timer, so a quick pass by never reloads the site. A
  // hidden tab holds the timer off; it starts over once the tab is back.
  useEffect(() => {
    if (live || !mounted || hidden) return;
    const id = window.setTimeout(() => {
      setMounted(false);
      setLoaded(false);
    }, EMBED_GRACE_MS);
    return () => window.clearTimeout(id);
  }, [live, mounted, hidden]);

  useEffect(() => {
    if (!mounted) return;
    setHeavyActive(true);
    return () => setHeavyActive(false);
  }, [mounted]);

  return (
    <div ref={box} className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${build.poster}`}>
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
          className={`pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-[1200ms] ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ width: view.w, height: view.h, transform: `scale(${view.scale})` }}
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
      <p className={`mt-3 max-w-md leading-relaxed text-ash ${compact ? "text-[14px] [@media(max-height:780px)]:line-clamp-3" : "mt-4 text-[15px]"}`}>{build.blurb}</p>

      <ul className={`mt-5 flex flex-wrap gap-2 ${compact ? "[@media(max-height:780px)]:hidden" : ""}`}>
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
/** A full turn: each card goes all the way round the column, passing behind it. */
const SWEEP = Math.PI * 2;
/** -1 brings cards up the right-hand side first. */
const DIRECTION = -1;
/** Widest swing, and how much of the stage it may use. A fixed radius either
 *  buries the orbit on a small window or wastes a big one. */
const RADIUS_MAX = 340;
const RADIUS_RATIO = 0.26;
const RISE = 0.82;
/**
 * How much of the orbit angle the card face actually turns through. At 1 it is a
 * true carousel panel, which means it goes edge-on at the sides and shows its
 * mirrored back at the rear. At 0.4 the peak turn is about 72°, so it visibly
 * rotates around the column and catches the light without ever reversing.
 */
const CARD_TURN = 0.4;
/** Stacking order of the column itself. Cards on the near half of the orbit sit
 *  above this, cards on the far half below, which is what actually puts them
 *  behind the particles rather than faking it with opacity. */
const PILLAR_Z = 40;
// Card sizing: the preview keeps a fixed 1 : 0.625 shape, the text body beneath it
// is roughly 300px, and the card never gets narrower than a phone-ish 280px.
const CARD_MAX_W = 496;
const CARD_MIN_W = 280;
const CARD_BODY_H = 300;
const CARD_IMG_RATIO = 0.625;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (edge0: number, edge1: number, v: number) => {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

type Mote = {
  ang: number;
  ring: number;
  u: number;
  speed: number;
  size: number;
  kind: 0 | 1 | 2 | 3;
  tint: number;
  alpha: number;
  spin: number;
  twist: number;
};

const EMBER: [number, number, number] = [233, 165, 104];
const ARC: [number, number, number] = [127, 209, 193];

function rgba(tint: number, a: number) {
  const r = Math.round(EMBER[0] + (ARC[0] - EMBER[0]) * tint);
  const g = Math.round(EMBER[1] + (ARC[1] - EMBER[1]) * tint);
  const b = Math.round(EMBER[2] + (ARC[2] - EMBER[2]) * tint);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

/**
 * The column the builds orbit, on its own 2D canvas.
 *
 * It is deliberately not part of the shared WebGL stage: that canvas is fixed
 * behind the whole page, so nothing could ever pass in front of it. Sitting in
 * the section's own stacking context is what lets a card go behind the column.
 *
 * Trails come from erasing the canvas a little each frame instead of clearing
 * it, so every mote smears along its own path for free. The erase is scaled by
 * frame time, otherwise trails would be twice as long at 60fps as at 120.
 *
 * `running` is the Orbit's gate: while the track is more than a tenth of a
 * screen off screen the tick returns straight away, so the column costs
 * nothing on the hero at rest, through Method and below. With the intake open
 * it holds its last frame (bus.paused) instead of drawing behind the drawer.
 */
function PillarCanvas({ running }: { running: RefObject<boolean> }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    let w = 1;
    let h = 1;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // A soft radial sprite per tint, drawn once. Every glowing mote is a scaled
    // copy of one of these: the gradient is the blur, and stretching it is what
    // makes a streak, so nothing pays for a per-frame gradient or a canvas blur.
    const sprites = Array.from({ length: 6 }, (_, i) => {
      const tint = i / 5;
      const r = Math.round(EMBER[0] + (ARC[0] - EMBER[0]) * tint);
      const g = Math.round(EMBER[1] + (ARC[1] - EMBER[1]) * tint);
      const b = Math.round(EMBER[2] + (ARC[2] - EMBER[2]) * tint);
      const s = 64;
      const spr = document.createElement("canvas");
      spr.width = s;
      spr.height = s;
      const sx = spr.getContext("2d");
      if (sx) {
        const grad = sx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
        grad.addColorStop(0.28, `rgba(${r},${g},${b},0.42)`);
        grad.addColorStop(0.62, `rgba(${r},${g},${b},0.09)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        sx.fillStyle = grad;
        sx.fillRect(0, 0, s, s);
      }
      return spr;
    });

    const motes: Mote[] = Array.from({ length: 300 }, () => {
      const r = Math.random();
      return {
        ang: Math.random() * Math.PI * 2,
        // Biased outward so the column reads as a wide, loose cloud rather than
        // a dense rope down the middle.
        ring: 0.18 + Math.pow(Math.random(), 0.55) * 0.82,
        u: Math.random(),
        speed: 0.03 + Math.random() * 0.1,
        size: 1.4 + Math.random() * 7,
        kind: (r < 0.58 ? 0 : r < 0.74 ? 1 : r < 0.9 ? 2 : 3) as Mote["kind"],
        tint: Math.random(),
        alpha: 0.05 + Math.random() * 0.17,
        spin: (Math.random() - 0.5) * 2.4,
        twist: 0.4 + Math.random() * 1.5,
      };
    });

    let time = 0;
    // True while gated off. The first frame back wipes the canvas once, so the
    // column restarts clean instead of fading out a frozen frame of trails.
    let parked = true;

    // GSAP hands the ticker elapsed seconds and delta in milliseconds. Reading
    // the first argument as milliseconds makes every delta ~0, which is exactly
    // what froze this column in place.
    const tick = (_t: number, deltaMs: number) => {
      // Frozen, not parked: the drawer closes onto the same frame it opened on.
      if (bus.paused) return;
      if (!running.current) {
        parked = true;
        return;
      }
      if (parked) {
        parked = false;
        ctx.clearRect(0, 0, w, h);
      }

      const dt = Math.min((deltaMs || 16.7) / 1000, 1 / 20);
      time += dt;

      // Erase rather than clear: what is left behind becomes the trail.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt * 3.4)).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const spread = w * 0.42;

      for (const m of motes) {
        m.u += m.speed * dt;
        if (m.u > 1) m.u -= 1;

        const a = m.ang + DIRECTION * (time * 0.22 * m.twist + m.u * Math.PI * 2 * 0.6);
        const depth = Math.cos(a);
        const near = 0.6 + 0.4 * (depth * 0.5 + 0.5);

        const x = cx + Math.sin(a) * spread * m.ring;
        const y = h - m.u * h * 1.12 + h * 0.06;
        // Dissolve at both ends so the column has no hard cut.
        const ends = Math.min(1, m.u / 0.16) * Math.min(1, (1 - m.u) / 0.18);
        const alpha = m.alpha * near * ends;
        if (alpha <= 0.004 || y < -60 || y > h + 60) continue;

        const size = m.size * near;
        const sprite = sprites[Math.min(5, Math.floor(m.tint * 6))];

        if (m.kind === 1) {
          // A thin ring, drawn flat so it stays crisp against all that glow.
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.strokeStyle = rgba(m.tint, alpha * 0.9);
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.arc(x, y, size * 1.6, 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }

        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha;

        if (m.kind === 2) {
          // The same sprite, stretched along its climb: a streak of light.
          const rw = size * 2.2;
          const rh = size * 9;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(depth * 0.3);
          ctx.drawImage(sprite, -rw / 2, -rh / 2, rw, rh);
          ctx.restore();
        } else if (m.kind === 3) {
          const s = size * 3.4;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(time * m.spin);
          ctx.drawImage(sprite, -s / 2, -s / 2, s, s * 0.45);
          ctx.drawImage(sprite, -s * 0.22, -s / 2, s * 0.45, s);
          ctx.restore();
        } else {
          const s = size * 4.2;
          ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
    };
  }, [running]);

  return (
    // h-full is not redundant with inset-y-0: a canvas is a replaced element, so
    // without an explicit height it falls back to its intrinsic 2:1 shape and the
    // column stopped about 410px down the stage at every window size.
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 h-full w-[min(820px,92%)] -translate-x-1/2"
      style={{ zIndex: PILLAR_Z }}
    />
  );
}

/**
 * No card may go live while the track's top is further down than this many
 * screens. At page load the track starts about 1.2–1.45 screens down (one
 * 100svh hero plus this section's header), so this keeps the first embed from
 * loading, and the Stage from dropping to DPR 1, while the visitor is still on
 * the hero. It goes live once the track reaches the bottom of the screen, about
 * a screen of scrolling before the stage pins.
 */
const EMBED_GATE = 1;

// Printer's crop marks at the corners of the pinned stage: four static 14px Ls,
// 24px in, above every card (the nearest card peaks at PILLAR_Z + 30).
const CROP_MARKS = [
  "left-6 top-6 border-l border-t",
  "right-6 top-6 border-r border-t",
  "bottom-6 left-6 border-b border-l",
  "bottom-6 right-6 border-b border-r",
] as const;

function Orbit({
  liveId,
  hidden,
  onLive,
}: {
  liveId: string | null;
  hidden: boolean;
  onLive: (id: string | null) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const front = useRef<string | null>(null);
  // Shared with the pillar: false while the track is more than a tenth of a
  // screen away, and then both ticks return before doing anything.
  const running = useRef(false);

  // Morph the card to the window: as wide as fits, narrower when the stage is
  // short so the text under the preview never has to shrink with it.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const size = () => {
      const byWidth = Math.min(CARD_MAX_W, el.clientWidth * 0.78);
      const byHeight = (el.clientHeight * 0.9 - CARD_BODY_H) / CARD_IMG_RATIO;
      el.style.setProperty("--card-w", `${Math.round(Math.max(CARD_MIN_W, Math.min(byWidth, byHeight)))}px`);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const tick = () => {
      const trackEl = track.current;
      const stageEl = stage.current;
      // The intake covers the page and nothing can scroll: no layout reads.
      if (!running.current || bus.paused || !trackEl || !stageEl) return;

      const rect = trackEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const far = rect.top > vh * EMBED_GATE || rect.bottom < -vh * 0.5;
      const span = rect.height - vh;
      const p = span > 0 ? clamp01(-rect.top / span) : 0;

      const stageH = stageEl.clientHeight;
      const radius = Math.min(RADIUS_MAX, stageEl.clientWidth * RADIUS_RATIO);
      // The card's width is set from the stage (see the effect below), so a short
      // window gets a narrower, differently-proportioned card with text at full
      // size. This scale is only the last resort if it is still too tall.
      const first = cards.current[0];
      const cardH = first ? first.offsetHeight : 0;
      const fit = cardH > 0 ? Math.min(1, (stageH * 0.94) / cardH) : 1;
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

        const a = (t - 0.5) * SWEEP * DIRECTION;
        const face = Math.cos(a);
        const edge = smooth(0, 0.16, t) * (1 - smooth(0.84, 1, t));
        // The far half stays readable — the column itself does the hiding now, so
        // it does not also need to be faded most of the way out.
        const opacity = edge * (0.58 + 0.42 * (0.5 + 0.5 * face));

        const lift = (0.5 - t) * RISE * stageH;
        el.style.visibility = opacity < 0.012 ? "hidden" : "visible";
        // Turn with the orbit, and tip slightly as it climbs, so the panel reads
        // as a physical thing travelling around the column.
        el.style.transform =
          `translate3d(${(Math.sin(a) * radius).toFixed(2)}px, ${lift.toFixed(2)}px, ${((face - 1) * radius).toFixed(2)}px)` +
          ` rotateY(${(a * CARD_TURN).toFixed(4)}rad)` +
          ` rotateX(${(-(lift / stageH) * 9).toFixed(2)}deg)` +
          ` scale(${fit.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        // Near half in front of the column, far half behind it.
        el.style.zIndex = String(face >= 0 ? PILLAR_Z + 10 + Math.round(face * 20) : PILLAR_Z - 10 + Math.round(face * 20));
        // Only a card on the near side should catch the pointer.
        el.style.pointerEvents = face > 0.25 && opacity > 0.6 ? "auto" : "none";

        if (edge > 0.5 && face > bestFace) {
          bestFace = face;
          bestId = BUILDS[i].id;
        }
      }

      // Cards still position while the track is approaching or leaving, but none
      // of them may start an embed that far out.
      if (far) bestId = null;

      // React only hears about the front card when it actually changes.
      if (bestId !== front.current) {
        front.current = bestId;
        onLive(bestId);
      }
    };

    // The gate. Either way it starts from "no front card": stopping hands the
    // embed back (the Frame lets it go after its grace), and starting then places
    // every card at once rather than a frame late, re-reporting the front card in
    // the same batch. Its first callback arrives right after observe() and always
    // acts, which also clears any live id the stack left behind when a resize
    // swapped it for this orbit.
    //
    // A tenth of a screen of margin, not the half the spec asked for: the track
    // starts 1.2–1.47 screens down at load, so a half-screen band had both ticks
    // (and ~290 pillar sprites a frame) running on the idle hero. Symmetric, so
    // scrolling back up into the pin reopens the gate before the stage shows
    // and the pillar never pops in a frame late.
    const trackEl = track.current;
    let near: boolean | null = null;
    const gate = new IntersectionObserver(
      (entries) => {
        const next = entries[entries.length - 1].isIntersecting;
        if (next === near) return;
        near = next;
        running.current = next;
        front.current = null;
        onLive(null);
        if (next) tick();
      },
      { rootMargin: "10% 0px" },
    );
    if (trackEl) gate.observe(trackEl);

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      gate.disconnect();
      running.current = false;
    };
  }, [onLive]);

  return (
    <div ref={track} data-orbit-track className="relative h-[340vh]">
      {/*
        Perspective sits on the stage, not on a wrapper around the cards: a
        wrapper would be its own stacking context and trap every card above the
        column. Here each card's z-index competes with the canvas directly.
      */}
      <div ref={stage} className="sticky top-0 h-screen overflow-hidden" style={{ perspective: "1150px" }}>
        <PillarCanvas running={running} />
        {CROP_MARKS.map((corner) => (
          <span
            key={corner}
            aria-hidden
            className={`pointer-events-none absolute h-3.5 w-3.5 border-rule-strong ${corner}`}
            style={{ zIndex: PILLAR_Z + 40 }}
          />
        ))}
        {BUILDS.map((build, i) => (
          <div key={build.id} className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
              <article
                ref={(el) => {
                  cards.current[i] = el;
                }}
                style={{ visibility: "hidden", willChange: "transform, opacity" }}
                className="w-[var(--card-w,31rem)]"
              >
                <div className="overflow-hidden rounded-xl border border-rule-strong bg-carbon/95 shadow-[0_50px_120px_-60px_rgba(0,0,0,1)]">
                  <div className="relative w-full" style={{ aspectRatio: `1 / ${CARD_IMG_RATIO}` }}>
                    <Frame build={build} live={liveId === build.id} hidden={hidden} />
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
  );
}

/* ---- the plain stack ---------------------------------------------------- */

// Each build arrives on the shared axis lock (lib/lock.ts), straight up, like
// every other block on the page. A motion whileInView here would server-render
// the cards at opacity 0 (invisible with no JS) and give each its own observer.
function Stack({ liveId, hidden, lite }: { liveId: string | null; hidden: boolean; lite: boolean }) {
  return (
    <div className="mt-20 flex flex-col gap-20 md:gap-28">
      {BUILDS.map((build) => (
        <article
          key={build.id}
          data-lock="c"
          className="grid gap-8 border-t border-rule pt-8 md:grid-cols-[1fr_1.05fr] md:items-center md:gap-12"
        >
          <Details build={build} />
          <TiltCard className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-rule shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] sm:aspect-[16/10]">
            <Frame build={build} live={!lite && liveId === build.id} hidden={hidden} />
          </TiltCard>
        </article>
      ))}
    </div>
  );
}

export function Work() {
  const { lite } = useDeviceProfile();
  const visible = usePageVisible();
  const reduce = useReducedMotion();
  // The orbit needs room to swing through and motion permission to run at all.
  // Kept low on purpose: plenty of real windows sit between 800 and 1024, and
  // at 1024 the whole thing silently fell back to the plain stack.
  const roomy = useMedia("(min-width: 700px)");
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

  // The orbit's 340vh track and the stack are very different heights, so every
  // trigger below this section (and the cube director's anchors) moves when one
  // swaps for the other. Only on a real swap: the first commit has nothing to
  // re-measure, and the page already refreshes once its fonts are in.
  const wasOrbiting = useRef(orbiting);
  useEffect(() => {
    if (wasOrbiting.current === orbiting) return;
    wasOrbiting.current = orbiting;
    ScrollTrigger.refresh();
  }, [orbiting]);

  return (
    <section id="work" className="relative py-28 md:py-36">
      <div className="shell">
        {/* The cube with its centre upright marked: the column below stands in for it. */}
        <CubeMark size={28} highlight={["centerUpright"]} />

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <RegisteredHeading
            as="h2"
            trigger="view"
            className="t-h2 font-display font-semibold text-bone"
            wrapperClassName="lg:col-span-7"
          >
            Three builds, running live.
          </RegisteredHeading>
          <p
            data-lock="c"
            style={{ "--ld": "140ms" } as CSSProperties}
            className="max-w-sm text-[15px] leading-relaxed text-ash lg:col-span-5 lg:justify-self-end"
          >
            {lite
              ? "Each build below is live on the web. Open one and try it — the 3D and the scrolling are all real."
              : "Keep scrolling and each one climbs past. Whichever is facing you is the real site, loaded and running right here."}
          </p>
        </div>
      </div>

      {/*
        liveId passes through untouched while the tab is hidden: nulling it
        tripped the Frame's grace and tore the embed down on every tab switch.
        `hidden` freezes the Frames instead, so the one-embed rule still holds.
      */}
      {orbiting ? (
        <Orbit liveId={liveId} hidden={!visible} onLive={setLiveId} />
      ) : (
        <div ref={stackRef} className="shell">
          <Stack liveId={liveId} hidden={!visible} lite={lite} />
        </div>
      )}
    </section>
  );
}
