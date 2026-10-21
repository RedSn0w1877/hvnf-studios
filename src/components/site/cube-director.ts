import { gsap, ScrollTrigger } from "@/lib/gsap";
import { CustomEase } from "gsap/CustomEase";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { bus } from "@/lib/bus";
import { ANCHOR, CUBE_REST, cube, type CubeState } from "./cube-3d";

/**
 * The scroll director: where the cube is and what it is doing, as a pure
 * function of scroll position.
 *
 * Not a stack of scrubbed ScrollTriggers. On each refresh it reads one rect per
 * hook, turns the pose table into per-channel keyframes in scroll px, and from
 * then on sample(s) is a lookup and an ease per channel: about 2µs, identical
 * for the same s however the visitor got there (fast flicks, anchor jumps,
 * scrolling back up), and nothing is ever left half-applied by a refresh.
 *
 * Layered on top, all time-based and all writing plain numbers into `cube`:
 *  - the hero intro, one gsap timeline on the intro channels;
 *  - one-shot locks (flash + dust burst) when s crosses the end of a lock;
 *  - pointer tilt, smoothed here and weighted by the pose's pointerWeight;
 *  - the drag throw on the hero and closing slots, which always lands on iso.
 *
 * Imported only by stage.tsx, so this file, CustomEase and InertiaPlugin all
 * stay in the lazy Stage chunk that lite devices never load.
 */

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase, InertiaPlugin);
  // Fast through the middle, then a long settle: the click of a part seating.
  // The spec's string ends in a quadratic tail (control 0.8,1 → 1,1), which
  // CustomEase rejects as an incomplete cubic; this is the same curve with
  // that tail degree-elevated to a cubic (controls at P0 + ⅔(Q−P0), P2 + ⅔(Q−P2)).
  CustomEase.create("lock", "M0,0 C0.2,0 0.08,1 0.62,0.99 0.74,0.99667 0.86667,1 1,1");
}

/**
 * How bright the giant frame sits behind the Work orbit. Set 0 to leave the
 * orbit untouched. Kept faint (with WORK_FRAME_GLOW) so the card captions
 * orbiting in front of it always read cleanly.
 */
export const WORK_FRAME_ALPHA = 0.12;
/** Halo strength on the frame during the pin hold: low, so it never lifts the dark behind the cards. */
const WORK_FRAME_GLOW = 0.12;

/**
 * Lattice units spanned by the 256-unit viewBox at the iso angle: one lattice
 * step is 8√3 SVG units across and 1/√2 local units after the iso rotation, so
 * 256 SVG units = 256 / (8√3·√2) = 32/√6 ≈ 13.06395 units. (cube-3d's
 * BOX_UNITS = 13.064 is this rounded; the exact value keeps the overlay under
 * a hundredth of a pixel even at the 2400px centre box.)
 */
export const BOX_LATTICE = 32 / Math.sqrt(6);

/** Pointer tilt at full pointerWeight, radians. */
const TILT_YAW = 0.12;
const TILT_PITCH = 0.08;

/** Index of each value in the pose vector the Stage renders from. */
export const POSE = {
  x: 0,
  y: 1,
  box: 2,
  yaw: 3,
  pitch: 4,
  scatter: 5,
  jitter: 6,
  explode: 7,
  draw: 8,
  dissolve: 9,
  paradox: 10,
  ember: 11,
  tint: 12,
  redline: 13,
  glow: 14,
  widthScale: 15,
  guides: 16,
  alpha: 17,
  flash: 18,
  burst: 19,
} as const;
export const POSE_SIZE = 20;

/* ── Keyframes ───────────────────────────────────────────────────────────── */

// The scroll channels of `cube`, all written by sample().
const CHANNELS = [
  "blendFromAnchor",
  "blendToAnchor",
  "blend",
  "box",
  "yaw",
  "pitch",
  "scatter",
  "explode",
  "draw",
  "dissolve",
  "paradox",
  "paradoxEmber",
  "tint",
  "redline",
  "glow",
  "widthScale",
  "guides",
  "alpha",
  "pointerWeight",
] as const satisfies readonly (keyof CubeState)[];
type Channel = (typeof CHANNELS)[number];
type Pose = Partial<Record<Channel, number>>;

// Anchor ids step; they never interpolate.
const STEPPED: ReadonlySet<Channel> = new Set<Channel>(["blendFromAnchor", "blendToAnchor"]);

type Ease = (t: number) => number;
const eases = new Map<string, Ease>();
const ease = (name: string): Ease => {
  let fn = eases.get(name);
  if (!fn) eases.set(name, (fn = gsap.parseEase(name)));
  return fn;
};
const LOCK = "lock";
const SINE = "sine.inOut";
const DEFAULT = "power2.inOut";

/** Keys sorted by s; e[i] eases the interval that ends at key i. `at` caches the last lookup. */
type Track = { s: number[]; v: number[]; e: Ease[]; at: number };
type Lock = { s: number; slot: "method" | "closing" };
type Plan = { tracks: Record<Channel, Track>; locks: Lock[] };

function read(track: Track, s: number, stepped: boolean): number {
  const { s: keys, v } = track;
  let i = track.at;
  while (i + 1 < keys.length && keys[i + 1] <= s) i++;
  while (i > 0 && keys[i] > s) i--;
  track.at = i;
  if (s <= keys[0] || stepped || i + 1 >= keys.length) return v[i];
  const t = (s - keys[i]) / (keys[i + 1] - keys[i]);
  return v[i] + (v[i + 1] - v[i]) * track.e[i + 1](t);
}

/* ── Measurement ─────────────────────────────────────────────────────────── */

type Rect = { x: number; y: number; w: number; h: number };
type Anchor = { x: number; y: number; box: number };

/** Everything the plan needs, in document px (x is viewport x: the page never scrolls sideways). */
type Layout = {
  vh: number;
  maxScroll: number;
  hero: Anchor | null;
  closing: Anchor | null;
  /** The sticky method slot's column: only x and width matter, y is pinned to mid-screen. */
  method: { x: number; w: number } | null;
  trackTop: number;
  trackBottom: number;
  steps: { first: number; last: number } | null;
  care: { top: number; bottom: number } | null;
  footerTop: number | null;
  /** Text the cube may pass behind (Work header, Method), for the contrast guard. */
  guards: Rect[];
};

const offset = (value: string, basis: number) =>
  value.endsWith("%") ? (parseFloat(value) / 100) * basis : parseFloat(value) || 0;

/**
 * An element's box as layout placed it, in document px. Translations on it or
 * its ancestors (an axis-lock entrance still pending, a Tailwind translate)
 * are taken back out, so a slot measured mid-entrance still lines up with
 * where it comes to rest.
 */
function place(el: Element, scrollY: number): Rect {
  const rect = el.getBoundingClientRect();
  let dx = 0;
  let dy = 0;
  for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.transform && style.transform !== "none") {
      const matrix = new DOMMatrixReadOnly(style.transform);
      dx += matrix.m41;
      dy += matrix.m42;
    }
    if (style.translate && style.translate !== "none") {
      const [tx = "0", ty = "0"] = style.translate.split(" ");
      const box = node as HTMLElement;
      dx += offset(tx, box.offsetWidth);
      dy += offset(ty, box.offsetHeight);
    }
  }
  return { x: rect.left - dx, y: rect.top + scrollY - dy, w: rect.width, h: rect.height };
}

function measure(): Layout {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const find = (selector: string) => document.querySelector(selector);
  const box = (el: Element | null) => (el ? place(el, scrollY) : null);
  const anchor = (el: Element | null): Anchor | null => {
    const r = box(el);
    return r && r.w > 0 ? { x: r.x + r.w / 2, y: r.y + r.h / 2, box: Math.min(r.w, r.h) } : null;
  };

  const orbit = find("[data-orbit-track]");
  const track = box(orbit ?? find("#work"));
  const slot = box(find("#method [data-cube-slot=method]"));
  const stepEls = document.querySelectorAll("#method [data-step]");
  const first = box(stepEls[0] ?? null);
  const last = box(stepEls[stepEls.length - 1] ?? null);
  const care = box(find("#care"));
  const footer = box(find("#closing"));

  const guards: Rect[] = [];
  document.querySelectorAll("#work [data-lock]:not([data-lock=none]), #method [data-lock]:not([data-lock=none])").forEach((el) => {
    if (!orbit?.contains(el)) guards.push(place(el, scrollY));
  });

  return {
    vh,
    maxScroll: ScrollTrigger.maxScroll(window),
    hero: anchor(find("[data-cube-slot=hero]")),
    closing: anchor(find("[data-cube-slot=closing]")),
    method: slot && slot.w > 0 ? { x: slot.x + slot.w / 2, w: slot.w } : null,
    trackTop: track ? track.y : vh,
    trackBottom: track ? track.y + track.h : 2 * vh,
    steps: first && last ? { first: first.y, last: last.y } : null,
    care: care ? { top: care.y, bottom: care.y + care.h } : null,
    footerTop: footer ? footer.y : null,
    guards,
  };
}

/* ── The pose table (spec 5.6) ───────────────────────────────────────────── */

function plan(m: Layout, wide: boolean): Plan {
  const { vh } = m;
  const tracks = {} as Record<Channel, Track>;
  for (const c of CHANNELS) tracks[c] = { s: [0], v: [CUBE_REST[c]], e: [ease("none")], at: 0 };
  // HERO REST: blend 0 of hero → centre is the hero itself, so T1 only has to move blend.
  tracks.blendToAnchor.v[0] = ANCHOR.center;

  const key = (c: Channel, s: number, v: number, name = DEFAULT) => {
    const t = tracks[c];
    t.s.push(Math.max(s, t.s[t.s.length - 1]));
    t.v.push(v);
    t.e.push(ease(name));
  };
  // Pin the current value at s, so the next key's interval starts there rather
  // than back at whatever key came before (a segment's channels hold between segments).
  const hold = (c: Channel, s: number) => {
    const t = tracks[c];
    if (t.s[t.s.length - 1] < s) key(c, s, t.v[t.v.length - 1]);
  };
  const tween = (c: Channel, from: number, to: number, v: number, name = DEFAULT) => {
    hold(c, from);
    key(c, to, v, name);
  };
  const set = (c: Channel, s: number, v: number) => {
    hold(c, s);
    key(c, s, v);
  };
  const setPose = (s: number, pose: Pose) => {
    for (const c of CHANNELS) {
      const v = pose[c];
      if (v !== undefined) set(c, s, v);
    }
  };

  // Segments run strictly in order: a short or odd layout can squeeze one, never reorder them.
  let cursor = 0;
  const segment = (from: number, to: number): [number, number] => {
    const a = Math.max(from, cursor);
    const b = Math.max(to, a + 1);
    cursor = b;
    return [a, b];
  };
  const lerp = ([a, b]: [number, number], t: number) => a + (b - a) * t;
  const locks: Lock[] = [];

  // T1 hero → work: the cube leaves its slot, comes apart, and opens into the
  // giant frame behind the pillar, its uprights rising off as dust.
  const t1 = segment(0, m.trackTop);
  const mid = lerp(t1, 0.45);
  const away: Pose = {
    blend: 0.55,
    box: 0.6,
    yaw: 0.9,
    pitch: -0.15,
    scatter: 0.6,
    explode: 0.25,
    glow: 0.55,
    guides: 0,
    pointerWeight: 0,
    alpha: 0.6,
  };
  for (const c of CHANNELS) {
    const v = away[c];
    if (v !== undefined) tween(c, t1[0], mid, v, SINE);
  }
  tween("blend", mid, t1[1], 1);
  tween("box", mid, t1[1], 1);
  tween("yaw", mid, t1[1], 0, LOCK);
  tween("pitch", mid, t1[1], 0, LOCK);
  tween("explode", mid, t1[1], 0);
  tween("glow", mid, t1[1], WORK_FRAME_GLOW);
  tween("paradox", mid, t1[1], 0);
  tween("alpha", mid, t1[1], WORK_FRAME_ALPHA);
  tween("dissolve", lerp(t1, 0.6), t1[1], 1);

  // PIN HOLD: screen-anchored and constant, so the Stage renders nothing.
  cursor = Math.max(cursor, m.trackBottom - vh);

  // T3 work → method. Below 1024 (or with no slot to land in) it fades out instead.
  const story = wide && m.method !== null && m.steps !== null;
  const t3 = segment(m.trackBottom - vh, m.steps ? m.steps.first - 0.65 * vh : m.trackBottom - 0.4 * vh);
  if (story) {
    set("blendFromAnchor", t3[0], ANCHOR.center);
    set("blendToAnchor", t3[0], ANCHOR.method);
    set("blend", t3[0], 0);
    tween("blend", t3[0], t3[1], 1);
  }
  tween("yaw", t3[0], lerp(t3, 0.5), -0.7);
  tween("yaw", lerp(t3, 0.5), t3[1], 0.35);
  tween("draw", t3[0], t3[1], 0);
  tween("dissolve", t3[0], t3[1], 0);
  tween("scatter", t3[0], t3[1], 0);
  tween("glow", t3[0], t3[1], 0.7);
  tween("tint", t3[0], t3[1], 1);
  tween("guides", t3[0], t3[1], 0.8);
  tween("alpha", t3[0], t3[1], story ? 1 : 0);
  let hiddenFrom = t3[1];

  if (story && m.steps) {
    // T4: draft, redline, build, lock, one quarter each.
    const t4 = segment(m.steps.first - 0.65 * vh, m.steps.last - 0.4 * vh);
    const part = (k: number) => lerp(t4, k / 4);
    tween("draw", part(0), part(1), 1);
    tween("yaw", part(0), part(1), 0.55);

    tween("redline", part(1), part(2), 1);
    tween("yaw", part(1), part(2), 0.45);

    tween("redline", part(2), part(3), 0);
    tween("tint", part(2), part(3), 0);
    tween("glow", part(2), part(3), 1);
    tween("widthScale", part(2), part(3), 1.25);
    tween("yaw", part(2), part(3), 0.2);

    // The brace is slid out and faded here, so turning it ember is invisible.
    set("paradoxEmber", part(3), 1);
    tween("paradox", part(3), part(4), 1, LOCK);
    tween("paradoxEmber", part(3), part(4), 0);
    tween("yaw", part(3), part(4), 0, LOCK);
    tween("pitch", part(3), part(4), 0, LOCK);
    tween("guides", part(3), part(4), 0.2);
    locks.push({ s: t4[1], slot: "method" });

    // METHOD HOLD, then COVER: the paper slides over the locked cube and it fades out.
    const coverEnd = m.care?.top ?? (m.footerTop !== null ? m.footerTop - 0.85 * vh : cursor + vh);
    const cover = segment(coverEnd - 0.5 * vh, coverEnd);
    tween("alpha", cover[0], cover[1], 0);
    hiddenFrom = cover[1];
  }

  // T6 closing. Its start pose is set the moment alpha reaches 0, so the jump
  // from wherever the cube was happens while nobody can see it (COVERED).
  if (m.closing) {
    setPose(hiddenFrom, {
      blendFromAnchor: ANCHOR.closing,
      blendToAnchor: ANCHOR.closing,
      blend: 0,
      box: 1,
      yaw: 1.2,
      pitch: -0.3,
      scatter: 1,
      explode: 0,
      draw: 1,
      dissolve: 0,
      paradox: 0,
      paradoxEmber: 0,
      tint: 0,
      redline: 0,
      glow: 0.18,
      widthScale: 1,
      guides: 0,
      alpha: 0,
      pointerWeight: 0,
    });
    const top = m.footerTop ?? m.closing.y - m.closing.box / 2;
    const t6 = segment(top - 0.85 * vh, Math.min(m.maxScroll - 1, top - 0.3 * vh));
    tween("alpha", t6[0], lerp(t6, 0.35), 1);
    tween("scatter", t6[0], t6[1], 0);
    tween("yaw", t6[0], t6[1], 0, LOCK);
    tween("pitch", t6[0], t6[1], 0, LOCK);
    tween("paradox", t6[0], t6[1], 1);
    tween("glow", t6[0], t6[1], 0.5);
    tween("guides", t6[0], t6[1], 0.35);
    tween("pointerWeight", t6[0], t6[1], 1);
    locks.push({ s: t6[1], slot: "closing" });
  }

  return { tracks, locks };
}

/* ── Contrast guard ──────────────────────────────────────────────────────── */

// Behind ash text, the brightest line pixel may reach #2a3036 over the ink
// background: that keeps ash at about 6:1. Line core alpha is the pixel's
// alpha, so the cap is solved per channel for the current tint.
const INK = [5, 8, 11];
const CEILING = [42, 48, 54];
const LINE_RGB = [230, 237, 241];
const DRAFT_RGB = [111, 176, 204];
/** Half the cube's space diagonal: a bounding circle that holds at any angle. */
const CUBE_RADIUS = 3 * Math.sqrt(3);
/** The cap eases in over this many px as the cube approaches text, so it never pops. */
const GUARD_RAMP = 96;

function guardFloor(tint: number) {
  let cap = 1;
  for (let k = 0; k < 3; k++) {
    const colour = LINE_RGB[k] + (DRAFT_RGB[k] - LINE_RGB[k]) * tint;
    cap = Math.min(cap, (CEILING[k] - INK[k]) / (colour - INK[k]));
  }
  return cap;
}

/* ── One-shots ───────────────────────────────────────────────────────────── */

// The intro's own versions of two scroll channels. The director rewrites the
// scroll channels every frame, so the intro cannot tween those directly.
type IntroExtra = { guideGain: number; ember: number };

function flash(peak: number) {
  gsap.killTweensOf(cube, "flash");
  gsap.to(cube, { flash: peak, duration: 0.12, ease: "power2.out" });
  gsap.to(cube, { flash: 0, duration: 0.42, delay: 0.12, ease: "power2.in" });
}

function burst() {
  gsap.killTweensOf(cube, "burst");
  gsap.fromTo(
    cube,
    { burst: 0 },
    {
      burst: 1,
      duration: 0.9,
      ease: "power2.out",
      onComplete: () => {
        cube.burst = 0;
      },
    },
  );
}

/** The click: everything lands at once, a flash and a puff of dust off the lines. */
function lockShot() {
  flash(1);
  burst();
}

/* ── The director ────────────────────────────────────────────────────────── */

export type Director = {
  /**
   * Builds the pose vector for scroll position s on a width × height canvas:
   * the scroll pose, plus the intro, the drag, the smoothed pointer and the
   * contrast guard. dt is seconds since the last ticker frame.
   */
  frame(s: number, dt: number, width: number, height: number, out: Float64Array): void;
  /** Called once, right before the Stage's first rendered frame: plays or skips the intro. */
  begin(): void;
  destroy(): void;
};

const INTRO_START: Partial<CubeState> = {
  introScatter: 1,
  introJitter: 1,
  introYaw: -0.95,
  introPitch: 0.35,
  introDraw: 0,
  paradoxSlide: 1,
};
const INTRO_END: Partial<CubeState> = {
  introScatter: CUBE_REST.introScatter,
  introJitter: CUBE_REST.introJitter,
  introYaw: CUBE_REST.introYaw,
  introPitch: CUBE_REST.introPitch,
  introDraw: CUBE_REST.introDraw,
  paradoxSlide: CUBE_REST.paradoxSlide,
};
/** The intro waits for at least this long after the Stage mounts (about when hydration ends). */
const INTRO_AFTER_MS = 600;
/** cube-mark.module.css reveals the static fallback this long after first paint. */
const MARK_LATE_MS = 2500;

export function createDirector(): Director {
  const bornAt = performance.now();
  const extra: IntroExtra = { guideGain: 1, ember: 0 };
  let layout = measure();
  let wide = false;
  let current: Plan;
  let previous: number | null = null;
  let begun = false;
  let destroyed = false;
  let intro: gsap.core.Timeline | null = null;
  let pointerX = bus.pointerX;
  let pointerY = bus.pointerY;
  const from: Anchor = { x: 0, y: 0, box: 0 };
  const to: Anchor = { x: 0, y: 0, box: 0 };

  const rebuild = () => {
    if (destroyed) return;
    layout = measure();
    current = plan(layout, wide);
  };

  // Method storytelling exists only at 1024 and up; below that the cube fades
  // out after Work and returns for the closing.
  const media = gsap.matchMedia();
  media.add("(min-width: 1024px)", () => {
    wide = true;
    rebuild();
    return () => {
      wide = false;
      rebuild();
    };
  });
  current = plan(layout, wide);

  // Re-measure whenever layout may have moved: ScrollTrigger's own refresh
  // (resize, Work's orbit/stack swap), the display face arriving, and any body
  // size change (Method's story/diagram swap, late content), debounced.
  ScrollTrigger.addEventListener("refresh", rebuild);
  document.fonts?.ready.then(rebuild, () => {});
  let settle = 0;
  const resize = new ResizeObserver(() => {
    window.clearTimeout(settle);
    settle = window.setTimeout(rebuild, 150);
  });
  resize.observe(document.body);

  /* Intro (spec 5.7) */

  const finishIntro = () => {
    intro?.kill();
    intro = null;
    Object.assign(cube, INTRO_END);
    extra.guideGain = 1;
    extra.ember = 0;
  };

  // Scrolled into the page already, or the static fallback has had time to be
  // revealed (a slow chunk): a replayed assembly would read as the logo
  // vanishing and rebuilding, so land on the finished cube instead. The WebGL
  // mark overlays the SVG pixel for pixel, so that swap is invisible.
  const skipIntro = () => {
    if (bus.scrollY > 0.5 * window.innerHeight) return true;
    const paint = performance.getEntriesByName("first-contentful-paint")[0];
    return paint !== undefined && performance.now() >= paint.startTime + MARK_LATE_MS - 50;
  };

  if (skipIntro()) finishIntro();
  else {
    // The t0 pose goes in now, so the first rendered frame is already the
    // scattered start rather than a finished cube that then blows apart.
    Object.assign(cube, INTRO_START);
    extra.guideGain = 0;
    extra.ember = 1;
  }

  const playIntro = () => {
    const wait = Math.max(0, bornAt + INTRO_AFTER_MS - performance.now()) / 1000;
    const peak = 1 / CUBE_REST.guides;
    intro = gsap
      .timeline({ delay: wait, onComplete: () => void (intro = null) })
      .call(() => {
        if (skipIntro()) finishIntro();
      })
      .to(cube, { introDraw: 1, duration: 0.55, ease: "power2.out" }, 0)
      .to(extra, { guideGain: peak, duration: 0.4, ease: "power2.out" }, 0.1)
      .to(cube, { introYaw: 0, introPitch: 0, introJitter: 0, duration: 1.6, ease: LOCK }, 0.15)
      .call(lockShot, undefined, 1.75)
      .to(cube, { paradoxSlide: 0, duration: 0.5, ease: LOCK }, 1.75)
      .to(extra, { guideGain: 1, duration: 1, ease: DEFAULT }, 2)
      .call(() => flash(0.6), undefined, 2.25)
      .to(extra, { ember: 0, duration: 0.8, ease: DEFAULT }, 2.25)
      .to(cube, { introScatter: 0, duration: 1.25, ease: DEFAULT }, 2.25);
  };

  /* Drag: turn it, let go, it always lands back on iso. */

  // Plain pointer events, not gsap's Observer: Observer picks ONE global event
  // family, and on a touchscreen laptop that is touch events only, so mouse
  // drags never arrived at all. Pointer events reach mouse, pen and touch alike.
  const DRAG_MIN = 6;
  const YAW_PER_PX = 0.0065;
  const PITCH_PER_PX = 0.0045;
  /** Release velocity is read from this much of the most recent movement. */
  const VELOCITY_MS = 100;

  const throwables = (["hero", "closing"] as const).flatMap((name) => {
    const slot = document.querySelector<HTMLElement>(`[data-cube-slot="${name}"]`);
    if (!slot) return [];

    let id: number | null = null;
    let dragged = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    // Recent moves as flat [time, x, y] triples, oldest first.
    const trail: number[] = [];

    const down = (event: PointerEvent) => {
      if (id !== null || !event.isPrimary || event.button !== 0) return;
      id = event.pointerId;
      dragged = false;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      trail.length = 0;
      trail.push(event.timeStamp, lastX, lastY);
      // Mouse and pen keep receiving moves when they leave the slot. Touch is
      // captured implicitly, and the browser still owns vertical pans (pan-y).
      try {
        slot.setPointerCapture(event.pointerId);
      } catch {}
    };

    const move = (event: PointerEvent) => {
      if (event.pointerId !== id) return;
      const x = event.clientX;
      const y = event.clientY;
      if (!dragged) {
        const dx = x - startX;
        const dy = y - startY;
        if (Math.abs(dx) < DRAG_MIN && Math.abs(dy) < DRAG_MIN) return;
        // A finger moving mostly up or down is scrolling the page: let it go.
        if (event.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) {
          end();
          return;
        }
        dragged = true;
        // Only a real drag catches the cube mid-throw. A plain click during the
        // swing home leaves that tween running, so it still lands on iso.
        gsap.killTweensOf(cube, "dragYaw,dragPitch");
      }
      cube.dragYaw = gsap.utils.clamp(-0.6, 0.6, cube.dragYaw + (x - lastX) * YAW_PER_PX);
      cube.dragPitch = gsap.utils.clamp(-0.6, 0.6, cube.dragPitch + (y - lastY) * PITCH_PER_PX);
      lastX = x;
      lastY = y;
      trail.push(event.timeStamp, x, y);
      while (trail.length > 3 && trail[0] < event.timeStamp - VELOCITY_MS) trail.splice(0, 3);
    };

    const end = (event?: PointerEvent) => {
      if (id === null || (event && event.pointerId !== id)) return;
      const pointer = id;
      id = null;
      try {
        if (slot.hasPointerCapture(pointer)) slot.releasePointerCapture(pointer);
      } catch {}
      if (!dragged) return;
      dragged = false;

      // px/s over the last ~100ms of movement; a pointer held still before
      // letting go has no recent moves left in the window, so it throws nothing.
      let vx = 0;
      let vy = 0;
      const now = event?.timeStamp ?? performance.now();
      const n = trail.length;
      if (n >= 6 && now - trail[n - 3] < VELOCITY_MS) {
        const dt = (trail[n - 3] - trail[0]) / 1000;
        if (dt > 0) {
          vx = (trail[n - 2] - trail[1]) / dt;
          vy = (trail[n - 1] - trail[2]) / dt;
        }
      }
      gsap.to(cube, {
        inertia: {
          dragYaw: { velocity: vx * YAW_PER_PX, end: 0 },
          dragPitch: { velocity: vy * PITCH_PER_PX, end: 0 },
          duration: { min: 0.6, max: 1.6 },
        },
        onComplete: lockShot,
      });
    };

    slot.addEventListener("pointerdown", down);
    slot.addEventListener("pointermove", move);
    slot.addEventListener("pointerup", end);
    slot.addEventListener("pointercancel", end);
    slot.addEventListener("lostpointercapture", end);
    return [
      () => {
        slot.removeEventListener("pointerdown", down);
        slot.removeEventListener("pointermove", move);
        slot.removeEventListener("pointerup", end);
        slot.removeEventListener("pointercancel", end);
        slot.removeEventListener("lostpointercapture", end);
      },
    ];
  });

  /* Per frame */

  const sample = (s: number) => {
    const { tracks, locks } = current;
    for (const c of CHANNELS) cube[c] = read(tracks[c], s, STEPPED.has(c));

    if (previous === null) {
      // Woke up already past the closing lock (a reload that restored the
      // scroll): no crossing will ever happen, so say it is built.
      const closing = locks.find((lock) => lock.slot === "closing");
      if (closing && s >= closing.s) dispatchLock("closing");
    } else if (s > previous) {
      // Locks fire on the way down only: crossing back up is the cube coming
      // apart again, which is not a click.
      for (const lock of locks) {
        if (previous < lock.s && s >= lock.s) {
          lockShot();
          dispatchLock(lock.slot);
        }
      }
    }
    previous = s;
  };

  const resolve = (id: number, s: number, width: number, height: number, out: Anchor) => {
    const { hero, closing, method } = layout;
    if (id === ANCHOR.hero && hero) {
      out.x = hero.x;
      out.y = hero.y - s;
      out.box = hero.box;
    } else if (id === ANCHOR.closing && closing) {
      out.x = closing.x;
      out.y = closing.y - s;
      out.box = closing.box;
    } else if (id === ANCHOR.method && method) {
      // The slot is sticky at 12vh, 76vh tall, so its centre holds at mid-screen.
      out.x = method.x;
      out.y = height / 2;
      out.box = Math.min(method.w, 0.7 * height);
    } else {
      // Centre: the hexagon stands 1.25 screens tall (it fills 0.75 of its box).
      out.x = width / 2;
      out.y = height / 2;
      out.box = (1.25 / 0.75) * height;
    }
  };

  const guard = (s: number, x: number, y: number, box: number, tint: number, explode: number) => {
    const floor = guardFloor(tint);
    const radius = (box / BOX_LATTICE) * (CUBE_RADIUS + 3 * explode);
    let cap = 1;
    for (const g of layout.guards) {
      const top = g.y - s;
      const dx = Math.max(g.x - x, 0, x - (g.x + g.w));
      const dy = Math.max(top - y, 0, y - (top + g.h));
      const gap = Math.hypot(dx, dy) - radius;
      if (gap >= GUARD_RAMP) continue;
      const t = Math.max(0, gap) / GUARD_RAMP;
      cap = Math.min(cap, floor + (1 - floor) * t * t * (3 - 2 * t));
    }
    return cap;
  };

  return {
    frame(s, dt, width, height, out) {
      sample(s);

      resolve(cube.blendFromAnchor, s, width, height, from);
      resolve(cube.blendToAnchor, s, width, height, to);
      const b = cube.blend;
      const x = from.x + (to.x - from.x) * b;
      const y = from.y + (to.y - from.y) * b;
      const box = (from.box + (to.box - from.box) * b) * cube.box;

      // Pointer smoothing, frame-rate independent. Snapped once it is within a
      // thousandth (≈0.03px of movement) so it settles to zero frames, not
      // asymptotically forever.
      const k = 1 - Math.exp(-6 * Math.min(dt, 0.25));
      pointerX += (bus.pointerX - pointerX) * k;
      pointerY += (bus.pointerY - pointerY) * k;
      if (Math.abs(bus.pointerX - pointerX) < 1e-3) pointerX = bus.pointerX;
      if (Math.abs(bus.pointerY - pointerY) < 1e-3) pointerY = bus.pointerY;
      const weight = cube.pointerWeight;

      const tint = cube.tint;
      const explode = cube.explode;
      out[POSE.x] = x;
      out[POSE.y] = y;
      out[POSE.box] = box;
      out[POSE.yaw] = cube.yaw + cube.introYaw + cube.dragYaw + pointerX * TILT_YAW * weight;
      out[POSE.pitch] = cube.pitch + cube.introPitch + cube.dragPitch + pointerY * TILT_PITCH * weight;
      out[POSE.scatter] = cube.scatter + cube.introScatter;
      out[POSE.jitter] = cube.introJitter;
      out[POSE.explode] = explode;
      out[POSE.draw] = cube.draw * cube.introDraw;
      out[POSE.dissolve] = cube.dissolve;
      out[POSE.paradox] = cube.paradox * (1 - cube.paradoxSlide);
      out[POSE.ember] = Math.max(cube.paradoxEmber, extra.ember);
      out[POSE.tint] = tint;
      out[POSE.redline] = cube.redline;
      out[POSE.glow] = cube.glow;
      out[POSE.widthScale] = cube.widthScale;
      out[POSE.guides] = Math.min(1, cube.guides * extra.guideGain);
      out[POSE.alpha] = cube.alpha > 0.002 ? Math.min(cube.alpha, guard(s, x, y, box, tint, explode)) : cube.alpha;
      out[POSE.flash] = cube.flash;
      out[POSE.burst] = cube.burst;
    },

    begin() {
      if (begun) return;
      begun = true;
      if (skipIntro()) finishIntro();
      else playIntro();
    },

    destroy() {
      destroyed = true;
      ScrollTrigger.removeEventListener("refresh", rebuild);
      resize.disconnect();
      window.clearTimeout(settle);
      media.revert();
      throwables.forEach((release) => release());
      intro?.kill();
      gsap.killTweensOf(cube);
      gsap.killTweensOf(extra);
      Object.assign(cube, CUBE_REST);
    },
  };
}

function dispatchLock(slot: Lock["slot"]) {
  window.dispatchEvent(new CustomEvent("hvnf:cube-lock", { detail: { slot } }));
}
