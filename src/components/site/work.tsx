"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SHOTS, type PosterFile, type Shot } from "@/assets/work";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { bus } from "@/lib/bus";
import { setHeavyActive, useDeviceProfile, useMedia, usePageVisible } from "@/lib/perf";
import { RegisteredHeading } from "./kit";

/**
 * The work: the demo sites orbiting a drawn upright, each rising around it and
 * fading at the top as the next one climbs into its place.
 *
 * Performance contract:
 *  - exactly ONE embed exists at a time (whichever site is nearest the front);
 *    every other card shows a screenshot of its site's first screen. Several
 *    WebGL sites at once would stall the page. The card taking the front takes
 *    the embed straight from the one before it, and a card that just leaves the
 *    front lets go after a short grace, so a visited site does not keep running
 *    off screen.
 *  - the orbit is transform and opacity only, written straight to style from a
 *    single ticker callback, and only on frames where the scroll or the stage
 *    actually moved (plus once right after a keyboard focus jumps a card to
 *    the front). No React state per frame, no layout reads beyond one rect, so
 *    the compositor does all of it. Cards off the orbit are opacity 0, never
 *    visibility hidden, so all of them stay reachable by keyboard and screen
 *    reader.
 *  - the orbit only ticks while the track is within a tenth of a screen of the
 *    viewport (one IntersectionObserver), and freezes while the intake covers
 *    the page. No embed loads until the track itself has reached the screen, so
 *    the hero at rest never pays for any of it.
 *  - a hidden tab keeps its embed: the browser already throttles it, and
 *    reloading the whole site on every tab switch would be the expensive part.
 *  - phones, weak CPUs, narrow windows and reduced-motion get a plain stack
 *    instead: same content, no orbit, no embeds on lite devices.
 */

type Build = {
  id: string;
  title: string;
  /** What the shop sells, as a plain label. */
  sector: string;
  blurb: string;
  href: string;
  /** Gradient behind the screenshot, shown until it decodes. */
  poster: string;
  /** The site's first screen, made by posters.mjs (see src/assets/work/index.ts). */
  shot: Shot;
  /** The demo's own brand colour, so no card borrows this site's ember. */
  accent: string;
};

const BUILDS: readonly Build[] = [
  // A new card is one object here plus its posters (posters.mjs writes them and the
  // SHOTS manifest). The orbit, the stack and the copy all size themselves to the count.
  {
    id: "penner",
    title: "Penner & Daughters",
    sector: "Auto repair",
    blurb: "Pick the noise your car is making and hear it. Then approve the repair estimate one line at a time.",
    href: "https://redsn0w1877.github.io/penner-and-daughters/",
    poster: "from-[#e4e8ed] via-[#dce1e7] to-[#cfd6de]",
    shot: SHOTS.penner,
    accent: "#1B44A3",
  },
  {
    id: "kroma",
    title: "Kroma Labs",
    sector: "Keyboards",
    blurb: "Press a key on your own keyboard and the same key goes down in the photo, with the click of the switch you picked.",
    href: "https://redsn0w1877.github.io/kroma-labs/",
    poster: "from-[#F2C200] via-[#E8B800] to-[#D9AC00]",
    shot: SHOTS.kroma,
    accent: "#F2C200",
  },
  {
    id: "apex",
    title: "Apex Dynamics",
    sector: "Running shoes",
    blurb:
      "The trail shoe pulls apart into its five layers. Further down, drag along the hills of a trail run and watch the numbers change.",
    href: "https://redsn0w1877.github.io/apex-dynamics/",
    poster: "from-slate-950 via-zinc-900 to-black",
    shot: SHOTS.apex,
    accent: "#CCFF00",
  },
  {
    id: "aetheria",
    title: "Aetheria Botanicals",
    sector: "Perfume",
    blurb: "Mix your own scent and the liquid in the bottle changes color to match. The glass catches the light as it turns.",
    href: "https://redsn0w1877.github.io/aetheria-botanicals/",
    poster: "from-[#f1ede5] via-[#ebe5da] to-[#e2dbcd]",
    shot: SHOTS.aetheria,
    accent: "#A88243",
  },
];

// Widths come from the manifest, not the import: Turbopack calls every AVIF 100px wide.
const srcSet = (files: readonly PosterFile[]) => files.map(({ file, width }) => `${file.src} ${width}w`).join(", ");

/**
 * The site's own first screen, under the iframe. Below 640px the card is the
 * stack's tall phone card, so it gets the top of the phone view; anything wider
 * gets the desktop view. Lazy and decoded off the main thread: every card has
 * one, and none of them are anywhere near the first screen.
 *
 * `out` dips it away once the live site has loaded and settled (SETTLE_MS). Not
 * a crossfade: the embed draws the site at the card's own small window, so the
 * two never line up, and halfway through a crossfade you would read two
 * headlines. Coming back (the embed let go) is instant, as the iframe is
 * already gone.
 */
function Still({ shot, sizes, out }: { shot: Shot; sizes: string; out: boolean }) {
  const { desktop, phone } = shot;
  const fallback = desktop.webp[desktop.webp.length - 1];
  return (
    <picture>
      <source media="(max-width: 639px)" type="image/avif" srcSet={srcSet(phone.avif)} />
      <source media="(max-width: 639px)" type="image/webp" srcSet={srcSet(phone.webp)} />
      <source type="image/avif" srcSet={srcSet(desktop.avif)} sizes={sizes} />
      <img
        src={fallback.file.src}
        srcSet={srcSet(desktop.webp)}
        sizes={sizes}
        width={fallback.width}
        height={fallback.height}
        alt=""
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover object-top ${out ? "opacity-0 transition-opacity duration-300" : ""}`}
      />
    </picture>
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
 * How long an embed outlives its turn at the front when no other card has
 * claimed it. Long enough that a card swinging past the front and straight back
 * does not reload; short enough that the page is back to zero embeds (and the
 * Stage back to full quality) soon after the orbit moves on.
 */
const EMBED_GRACE_MS = 1200;
/**
 * How long the still stays up after the embed has loaded. The demos open with
 * an intro the first time (Apex's panel wipe runs 1.2s, Aetheria's veil lifts
 * by 2.4s), and the card should show the site, not the intro half-way through.
 */
const SETTLE_MS = 2600;

/**
 * Whoever holds the page's one embed, as its "let go" function. A card claiming
 * the front calls it in the same tick as it mounts its own, so React commits the
 * swap in one go: the old iframe and its heavy flag go out as the new ones come
 * in. There are never two sites running, and the flag never drops in between,
 * which would make the Stage re-render twice at a new DPR mid-hold.
 */
let holder: (() => void) | null = null;

/**
 * `hidden` is the tab being in the background. It freezes the embed where it
 * is: nothing new mounts, and the one already running is not let go, so
 * switching tabs and back never reloads the live site.
 */
function Frame({ build, live, hidden, sizes }: { build: Build; live: boolean; hidden: boolean; sizes: string }) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({ w: 1024, h: 640, scale: PREVIEW_SCALE });
  const box = useRef<HTMLDivElement>(null);
  // The settle timer. Cleared whenever the embed goes, so a late one can never
  // dip the still away over a card with no site in it.
  const settle = useRef(0);
  const release = useCallback(() => {
    window.clearTimeout(settle.current);
    setMounted(false);
    setLoaded(false);
  }, []);
  useEffect(() => () => window.clearTimeout(settle.current), []);

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

  // At the front: claim the embed after a moment, so a card only passing
  // through never loads its site at all.
  useEffect(() => {
    if (!live || hidden) return;
    const id = window.setTimeout(() => {
      if (holder !== release) holder?.();
      holder = release;
      setMounted(true);
    }, 300);
    return () => window.clearTimeout(id);
  }, [live, hidden, release]);

  // Off the front: unmount the embed once the grace runs out. Coming back inside
  // the grace clears the timer, so a quick pass by never reloads the site. A
  // hidden tab holds the timer off; it starts over once the tab is back.
  useEffect(() => {
    if (live || !mounted || hidden) return;
    const id = window.setTimeout(release, EMBED_GRACE_MS);
    return () => window.clearTimeout(id);
  }, [live, mounted, hidden, release]);

  useEffect(() => {
    if (!mounted) return;
    setHeavyActive(true);
    return () => {
      setHeavyActive(false);
      if (holder === release) holder = null;
    };
  }, [mounted, release]);

  return (
    <div ref={box} className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${build.poster}`}>
      <Still shot={build.shot} sizes={sizes} out={loaded} />
      {mounted ? (
        <iframe
          src={build.href}
          title={`Preview of the ${build.title} site`}
          loading="lazy"
          tabIndex={-1}
          onLoad={() => {
            window.clearTimeout(settle.current);
            settle.current = window.setTimeout(() => setLoaded(true), SETTLE_MS);
          }}
          className={`pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-700 ${loaded ? "opacity-100 delay-200" : "opacity-0"}`}
          style={{ width: view.w, height: view.h, transform: `scale(${view.scale})` }}
        />
      ) : null}
    </div>
  );
}

/** The text half of a card, shared by both layouts. */
function Details({ build, compact }: { build: Build; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] leading-5 text-ash">{build.sector}</p>

      <h3
        className={`font-display font-semibold tracking-[-0.012em] text-bone ${compact ? "mt-3 text-[1.6rem] leading-tight" : "mt-4 text-[clamp(1.5rem,1.1rem+1.2vw,2rem)] leading-[1.1]"}`}
      >
        {build.title}
      </h3>
      <p className={`mt-3 max-w-md leading-relaxed text-ash ${compact ? "text-[14px] [@media(max-height:780px)]:line-clamp-3" : "mt-4 text-[15px]"}`}>{build.blurb}</p>

      {/* The demo's own colour on hover, never this site's ember. */}
      <a
        href={build.href}
        target="_blank"
        rel="noreferrer"
        style={{ "--accent": build.accent } as CSSProperties}
        className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-rule-strong pb-1 text-[15px] text-bone transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        Visit {build.title}
        <ArrowUpRight size={15} aria-hidden />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}

/* ---- the orbit ---------------------------------------------------------- */

/**
 * Each card's own progress t runs 0 → 1 as it climbs the column, and every
 * number in this schedule follows from the number of cards, so adding a card is
 * a change to BUILDS alone:
 *  - GAP spaces the cards evenly round the column, so one is always near the front;
 *  - the first card is already a third of the way up when the stage pins (LEAD),
 *    and the last is still in view at the side when it unpins (EXIT: face about
 *    0.25, opacity about 0.88), so neither end of the pin is an empty screen;
 *  - the track is as long as that takes at a fixed pace, so every card holds the
 *    front for the same stretch of scrolling however many there are.
 */
const N = BUILDS.length;
const LEAD = 0.3;
const GAP = 1 / N;
const EXIT = 0.8;
const SPAN = EXIT - LEAD + (N - 1) * GAP;
/** Screens of scrolling per unit of t: the pace the orbit has always had. */
const SCREENS_PER_T = 1.69;
/** One screen for the sticky stage, plus the schedule: 297vh for three cards, 311vh for four. */
const TRACK_VH = Math.round(100 * (1 + SPAN * SCREENS_PER_T));
/** A full turn: each card goes all the way round the column, passing behind it. */
const SWEEP = Math.PI * 2;
/** -1 brings cards up the right-hand side first. */
const DIRECTION = -1;
/** Above 1, cards linger near the front of the orbit. */
const DWELL = 1.7;
/** Widest swing, and how much of the stage it may use. A fixed radius either
 *  buries the orbit on a small window or wastes a big one. */
const RADIUS_MAX = 600;
const RADIUS_RATIO = 0.4;
const RISE = 0.82;
/**
 * How much of the orbit angle the card face turns through. At 1 each card is a
 * true panel on a cylinder: it faces outward from the column wherever it is, goes
 * edge-on at the sides and shows its back at the rear. Anything less is a card
 * that slides sideways while squashing, which is what this used to look like.
 */
const CARD_TURN = 1;
/** Stacking order of the upright. Cards on the near half of the orbit sit above
 *  this, cards on the far half below, which is what actually puts them behind
 *  the column rather than faking it with opacity. */
const PILLAR_Z = 40;
/** z-index steps per half of the orbit. Fine enough that two cards crossing at
 *  the front never tie: a tie fell back to DOM order, which could paint the
 *  farther card over the nearer one. */
const Z_STEPS = 200;
/** Below this stage width the radius is too small for the card leaving the
 *  front and the one arriving to clear each other. */
const NARROW_STAGE = 1024;
/**
 * On a narrow stage the card leaving the front dims once the next card has
 * passed in front of it (their crossover, t = 0.5 + GAP / 2), down to 40%, so
 * the strip still showing reads as going away rather than cut off. Never
 * before the crossover: it is the nearer card until then, drawn on top, and a
 * see-through card on top shows both sites at once. Tied to GAP, so four cards
 * dim at the same point as three.
 */
const RECEDE_FROM = 0.5 + GAP * 0.5;
const RECEDE_TO = 0.5 + GAP * 0.8;
const RECEDE_DIM = 0.6;
// Card sizing: the preview keeps a fixed 1 : 0.625 shape, the text body beneath it
// is about 245px with a two-line blurb (260 leaves room for a third), and the card
// never gets narrower than a phone-ish 280px.
const CARD_MAX_W = 496;
const CARD_MIN_W = 280;
const CARD_BODY_H = 260;
const CARD_IMG_RATIO = 0.625;
/** The still's drawn width, for the browser's pick of file: never more than the card. */
const ORBIT_SIZES = `${CARD_MAX_W}px`;

/**
 * The cube mark's centre upright, drawn: two hairlines with the mark's break in
 * them. Static DOM, painted once, at PILLAR_Z in the stage's own stacking context.
 */
const UPRIGHT_MASK = "linear-gradient(180deg, #000 0 41%, transparent 41% 47%, #000 47% 100%)";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Focus that came from the keyboard. A browser too old to know :focus-visible
 *  throws on the selector; count that as keyboard (the old Safari still around
 *  never focuses a link on click anyway). */
const keyboardFocus = (el: Element) => {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
};
const smooth = (edge0: number, edge1: number, v: number) => {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * No card may go live while the track's top is further down than this many
 * screens. At page load the track starts about 1.2–1.45 screens down (one
 * 100svh hero plus this section's header), so this keeps the first embed from
 * loading, and the Stage from dropping to DPR 1, while the visitor is still on
 * the hero. It goes live once the track reaches the bottom of the screen, about
 * a screen of scrolling before the stage pins.
 */
const EMBED_GATE = 1;

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
  // False while the track is more than a tenth of a screen away; the tick then
  // returns before doing anything.
  const running = useRef(false);
  // Places every card for the scroll position right now. The ticker calls it
  // while the track is near; a keyboard focus calls it straight after its jump.
  const place = useRef<() => void>(() => {});

  // Tabbing to a card's link turns the orbit until that card faces you, so a
  // keyboard can reach every site, not only whichever is in front. Keyboard
  // focus only: a click already lands on the card that faces you.
  const bringToFront = useCallback((i: number, target: EventTarget) => {
    const trackEl = track.current;
    if (!trackEl || !(target instanceof Element) || !keyboardFocus(target)) return;
    // The scroll at which this card's t is 0.5, the front of the orbit.
    const p = clamp01((0.5 - LEAD + i * GAP) / SPAN);
    const y = Math.round(trackEl.getBoundingClientRect().top + window.scrollY + p * (trackEl.offsetHeight - window.innerHeight));
    const land = () => {
      // "instant" beats html's smooth scrolling; Lenis follows the native jump.
      window.scrollTo({ top: y, behavior: "instant" });
      // Now, not next frame: the browser checks right after this whether the
      // focused link is on screen, and would scroll to where the card used to be.
      place.current();
    };
    land();
    // A smooth scroll the browser already had running (Tab to the closing
    // button, then straight back) carries on over the jump. Land again on the
    // next frames until it has stopped, and back off as soon as the visitor
    // scrolls, taps or presses another key.
    const intents = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    let frames = 0;
    let id = 0;
    const stop = () => {
      cancelAnimationFrame(id);
      intents.forEach((type) => window.removeEventListener(type, stop));
    };
    const check = () => {
      if (document.activeElement !== target || ++frames > 30) return stop();
      if (Math.abs(window.scrollY - y) > 1) land();
      id = requestAnimationFrame(check);
    };
    intents.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    id = requestAnimationFrame(check);
  }, []);

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
    // What the last pass was worked out from. The hold mostly sits still, so a
    // frame with nothing new returns before touching a single card.
    let last = "";
    const draw = () => {
      const trackEl = track.current;
      const stageEl = stage.current;
      // The intake covers the page and nothing can scroll: no layout reads.
      if (bus.paused || !trackEl || !stageEl) return;

      const rect = trackEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const stageW = stageEl.clientWidth;
      const stageH = stageEl.clientHeight;
      // The card's width is set from the stage (see the effect above), so a short
      // window gets a narrower, differently-proportioned card with text at full
      // size. This scale is only the last resort if it is still too tall.
      const first = cards.current[0];
      const cardH = first ? first.offsetHeight : 0;
      const key = `${rect.top} ${rect.height} ${vh} ${stageW} ${stageH} ${cardH}`;
      if (key === last) return;
      last = key;

      const far = rect.top > vh * EMBED_GATE || rect.bottom < -vh * 0.5;
      const span = rect.height - vh;
      const p = span > 0 ? clamp01(-rect.top / span) : 0;
      const radius = Math.min(RADIUS_MAX, stageW * RADIUS_RATIO);
      const fit = cardH > 0 ? Math.min(1, (stageH * 0.94) / cardH) : 1;
      const narrow = stageW < NARROW_STAGE;
      let bestFace = -2;
      let bestId: string | null = null;

      for (let i = 0; i < BUILDS.length; i++) {
        const el = cards.current[i];
        if (!el) continue;

        const t = SPAN * p + LEAD - i * GAP;
        if (t < -0.15 || t > 1.15) {
          // Off the orbit: not drawn and not clickable. Opacity, not
          // visibility, so the card stays in the tab order and the
          // accessibility tree, and a keyboard can still bring it round.
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          continue;
        }

        // Eased so the angle changes slowly near the front and quickly through the
        // sides and back: each card dwells facing you long enough to read, then
        // swings round.
        const u = (t - 0.5) * 2;
        const a = Math.sign(u) * Math.pow(Math.abs(u), DWELL) * (SWEEP / 2) * DIRECTION;
        const face = Math.cos(a);
        const edge = smooth(0, 0.16, t) * (1 - smooth(0.84, 1, t));
        // A card past the sides is showing its back, so it dims right down instead
        // of presenting mirrored text; the front half stays fully readable.
        let opacity = edge * (0.2 + 0.8 * smooth(-0.35, 0.45, face));
        // Narrow stage: the card leaving the front gives way to the next one once
        // that one is in front of it. Not the last card, which nothing follows
        // and which is in view as the pin lets go.
        if (narrow && i < N - 1) opacity *= 1 - RECEDE_DIM * smooth(RECEDE_FROM, RECEDE_TO, t);
        if (opacity < 0.012) opacity = 0;

        const lift = (0.5 - t) * RISE * stageH;
        // Turn with the orbit, and tip slightly as it climbs, so the panel reads
        // as a physical thing travelling around the column.
        el.style.transform =
          `translate3d(${(Math.sin(a) * radius).toFixed(2)}px, ${lift.toFixed(2)}px, ${((face - 1) * radius).toFixed(2)}px)` +
          ` rotateY(${(a * CARD_TURN).toFixed(4)}rad)` +
          ` rotateX(${(-(lift / stageH) * 5).toFixed(2)}deg)` +
          ` scale(${fit.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        // Near half in front of the column, far half behind it.
        const depth = Math.round(face * Z_STEPS);
        el.style.zIndex = String(face >= 0 ? PILLAR_Z + 1 + depth : PILLAR_Z - 1 + depth);
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
    const tick = () => {
      if (running.current) draw();
    };
    place.current = draw;

    // The gate. Either way it starts from "no front card": stopping hands the
    // embed back (the Frame lets it go after its grace), and starting then places
    // every card at once rather than a frame late, re-reporting the front card in
    // the same batch. Its first callback arrives right after observe() and always
    // acts, which also clears any live id the stack left behind when a resize
    // swapped it for this orbit.
    //
    // A tenth of a screen of margin, not the half the spec asked for: the track
    // starts 1.2–1.47 screens down at load, so a half-screen band had the tick
    // running on the idle hero. Symmetric, so scrolling back up into the pin
    // reopens the gate before the stage shows.
    const trackEl = track.current;
    let near: boolean | null = null;
    const gate = new IntersectionObserver(
      (entries) => {
        const next = entries[entries.length - 1].isIntersecting;
        if (next === near) return;
        near = next;
        running.current = next;
        front.current = null;
        last = "";
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
      place.current = () => {};
    };
  }, [onLive]);

  return (
    <div ref={track} data-orbit-track className="relative" style={{ height: `${TRACK_VH}vh` }}>
      {/*
        Perspective sits on the stage, not on a wrapper around the cards: a
        wrapper would be its own stacking context and trap every card above the
        upright. Here each card's z-index competes with it directly.

        overflow: clip, not hidden: a hidden box can still be scrolled by the
        browser, and focusing a link on a card below the fold scrolled the whole
        stage up inside itself. The class is the fallback where clip is unknown.
      */}
      <div ref={stage} className="sticky top-0 h-screen overflow-hidden" style={{ perspective: "1150px", overflow: "clip" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-14 -translate-x-1/2 border-x border-line/16"
          style={{ zIndex: PILLAR_Z, maskImage: UPRIGHT_MASK, WebkitMaskImage: UPRIGHT_MASK }}
        />
        {BUILDS.map((build, i) => (
          <div key={build.id} className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
            <article
              ref={(el) => {
                cards.current[i] = el;
              }}
              onFocus={(event) => bringToFront(i, event.target)}
              style={{ opacity: 0, pointerEvents: "none", willChange: "transform, opacity", backfaceVisibility: "hidden" }}
              className="w-[var(--card-w,31rem)]"
            >
              <div className="overflow-hidden rounded-xl border border-rule-strong bg-carbon/95 shadow-[0_50px_120px_-60px_rgba(0,0,0,1)]">
                <div className="relative w-full" style={{ aspectRatio: `1 / ${CARD_IMG_RATIO}` }}>
                  <Frame build={build} live={liveId === build.id} hidden={hidden} sizes={ORBIT_SIZES} />
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

/**
 * The stack's card is the right-hand column from 768px (just under half the
 * screen, 606px at most) and the full column below that. Under 640px the
 * phone still has one file, so its size does not matter.
 */
const STACK_SIZES = "(min-width: 1344px) 606px, (min-width: 768px) 46vw, 100vw";

// Each card arrives on the shared axis lock (lib/lock.ts), straight up, like
// every other block on the page. A motion whileInView here would server-render
// the cards at opacity 0 (invisible with no JS) and give each its own observer.
// On a phone the card is tall (4:5), so the still shows the whole top of the
// site as it looks on a phone, headline included.
function Stack({ liveId, hidden, lite }: { liveId: string | null; hidden: boolean; lite: boolean }) {
  return (
    <div className="mt-16 flex flex-col gap-20 md:gap-28">
      {BUILDS.map((build) => (
        <article
          key={build.id}
          data-lock="c"
          className="grid gap-8 border-t border-rule pt-8 md:grid-cols-[1fr_1.05fr] md:items-center md:gap-12"
        >
          <Details build={build} />
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-rule shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] sm:aspect-[16/10]">
            <Frame build={build} live={!lite && liveId === build.id} hidden={hidden} sizes={STACK_SIZES} />
          </div>
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

  // The orbit's track and the stack are very different heights, so every
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
    // A shorter top than the other sections: the heading runs straight into the pin.
    <section id="work" className="relative py-28 md:pb-36 md:pt-24">
      {/* Outside the track on purpose: the director's contrast guard reads this header's data-lock. */}
      <div className="shell">
        {/* 20ch, not .t-h2's 16ch: the one long section heading stays on one line from 768 up. */}
        <RegisteredHeading as="h2" trigger="view" className="t-h2 max-w-[20ch] font-display font-semibold text-bone">
          A few sites we’ve made
        </RegisteredHeading>
        <p
          data-lock="c"
          style={{ "--ld": "140ms" } as CSSProperties}
          className="mt-5 max-w-[36rem] text-[16px] leading-relaxed text-ash"
        >
          We made these brands up so we could go all out. A dentist doesn’t need a spinning perfume bottle, so your
          site will be calmer. Each one’s a working site you can open and click around in.
        </p>
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
