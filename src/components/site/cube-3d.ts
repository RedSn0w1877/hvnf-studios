import { SEGMENTS, SUBSETS, type Lattice, type Segment } from "@/lib/cube";

/**
 * The cube's 3D side: everything only the WebGL Stage reads.
 *
 * lib/cube holds the lattice table the SVG marks draw from, and ships in the
 * main chunk. This file adds what only a 3D renderer needs on top of it (the
 * iso camera, seeded scatter depth and jitter, outward normals, shader groups)
 * plus the live, mutable `cube` state the director writes. It is imported only
 * by stage.tsx, cube-director.ts and cube-shader.ts, so all of it rides in the
 * lazy Stage chunk that lite devices never load.
 */

export type Vec3 = readonly [x: number, y: number, z: number];

/**
 * Lattice point → the Stage's local 3D space: centred on the cube, y up.
 * b and c swap places so c (the logo's vertical) becomes three.js's up axis.
 */
export function local([a, b, c]: Lattice): Vec3 {
  return [a - 3, c - 3, b - 3];
}

/**
 * The one true angle. With `group.rotation.set(ISO_PITCH + pitch, ISO_YAW + yaw, 0, "XYZ")`,
 * an orthographic camera at zoom 1 and `group.scale = box / BOX_UNITS`, the 3D
 * cube overlays a `box`-px SVG of the logo pixel for pixel.
 */
export const ISO_PITCH = 0.6154797; // atan(1/√2)
export const ISO_YAW = -Math.PI / 4;
/** The 256-unit viewBox measured in local lattice units at the iso angle. */
export const BOX_UNITS = 13.064;

/* ── Groups ──────────────────────────────────────────────────────────────── */

/** Bitmask groups. Bit order matches the shader's aGroup vec4: outline, upright, paradox, redline. */
export const GROUP = { OUTLINE: 1, UPRIGHT: 2, PARADOX: 4, REDLINE: 8 } as const;

// The uprights that dissolve into the Work pillar: the eight front verticals
// (with their clearance gaps), not every vertical in SUBSETS.uprights.
const UPRIGHT = [0, 1, 2, 3, 4, 5, 6, 7];
const { outline: OUTLINE, brace: BRACE, redline: REDLINE, nearY: NEAR_Y, uprights: VERTICALS } = SUBSETS;

/* ── Derived per-segment data ────────────────────────────────────────────── */

export type Segment3D = Segment & {
  /** GROUP bitmask. */
  readonly group: number;
  /** Draw-on order, 0 (first) to 1 (last): outline, near Y, uprights, the rest, brace. */
  readonly order: number;
  /** Seeded scatter depth along the view axis, −1..1. */
  readonly depth: number;
  /** Seeded unit vector for the intro jitter. */
  readonly jitter: Vec3;
  /** Unit vector from the cube centre through the segment midpoint, in local space. */
  readonly normal: Vec3;
};

// Draw order as one sequence: each tier in the order the spec lists it, then
// everything not yet placed, with the brace held back so it lands last.
const SEQUENCE = [
  ...new Set([...OUTLINE, ...NEAR_Y, ...VERTICALS, ...SEGMENTS.keys()].filter((i) => !BRACE.includes(i))),
  ...BRACE,
];

// xorshift32, fixed seed: the scatter looks hand-placed and is identical on
// every load, so nothing about the cube is random at runtime.
let seed = 0x5f3a19;
function rand() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
}

function unit(v: Vec3, fallback: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]);
  return length > 1e-6 ? [v[0] / length, v[1] / length, v[2] / length] : fallback;
}

export const SEGMENTS_3D: readonly Segment3D[] = SEGMENTS.map((segment, i) => {
  const { p, q } = segment;
  // Three draws per segment, in this order, so the scatter is the one the
  // timings were tuned against.
  const depth = rand() * 2 - 1;
  // Uniform direction on the sphere: z uniform in −1..1, angle uniform around it.
  const z = rand() * 2 - 1;
  const turn = rand() * Math.PI * 2;
  const ring = Math.sqrt(1 - z * z);
  const mid = local([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]);
  return {
    ...segment,
    group:
      (OUTLINE.includes(i) ? GROUP.OUTLINE : 0) |
      (UPRIGHT.includes(i) ? GROUP.UPRIGHT : 0) |
      (BRACE.includes(i) ? GROUP.PARADOX : 0) |
      (REDLINE.includes(i) ? GROUP.REDLINE : 0),
    order: SEQUENCE.indexOf(i) / (SEGMENTS.length - 1),
    depth,
    jitter: [ring * Math.cos(turn), ring * Math.sin(turn), z],
    normal: unit(mid, [0, 1, 0]),
  };
});

/* ── Runtime state ───────────────────────────────────────────────────────── */

/** Anchor ids for blendFromAnchor / blendToAnchor. Numbers, so the pose stays a flat float vector. */
export const ANCHOR = { hero: 0, center: 1, method: 2, closing: 3 } as const;

export type CubeState = {
  // Scroll pose: written by the director from scroll position alone.
  blendFromAnchor: number;
  blendToAnchor: number;
  /** 0 = at the from-anchor, 1 = at the to-anchor. */
  blend: number;
  /** Multiplier on the blended anchor box (1 = the box as measured). */
  box: number;
  yaw: number;
  pitch: number;
  scatter: number;
  explode: number;
  draw: number;
  dissolve: number;
  /** 1 = brace home; 0 = slid 6 units out along its own diagonal and faded. */
  paradox: number;
  paradoxEmber: number;
  /** 0 = line white, 1 = draft cyan. */
  tint: number;
  redline: number;
  glow: number;
  widthScale: number;
  guides: number;
  alpha: number;
  pointerWeight: number;
  // Intro and one-shots: time-based gsap tweens layered on the scroll pose.
  introYaw: number;
  introPitch: number;
  introScatter: number;
  introJitter: number;
  introDraw: number;
  paradoxSlide: number;
  flash: number;
  burst: number;
  // Drag: the visitor's throw, always inertia-tweened back to 0.
  dragYaw: number;
  dragPitch: number;
};

/** The settled hero pose: no scroll, intro finished, nothing dragged. */
export const CUBE_REST: Readonly<CubeState> = {
  blendFromAnchor: ANCHOR.hero,
  blendToAnchor: ANCHOR.hero,
  blend: 0,
  box: 1,
  yaw: 0,
  pitch: 0,
  scatter: 0,
  explode: 0,
  draw: 1,
  dissolve: 0,
  paradox: 1,
  paradoxEmber: 0,
  tint: 0,
  redline: 0,
  glow: 0.5,
  widthScale: 1,
  guides: 0.35,
  alpha: 1,
  pointerWeight: 1,
  introYaw: 0,
  introPitch: 0,
  introScatter: 0,
  introJitter: 0,
  introDraw: 1,
  paradoxSlide: 0,
  flash: 0,
  burst: 0,
  dragYaw: 0,
  dragPitch: 0,
};

/**
 * The live cube. A plain mutable object, never React state: the director, the
 * intro tweens and the drag write it, and the Stage reads it once per gsap
 * tick. Final yaw = yaw + introYaw + dragYaw + pointer yaw × pointerWeight;
 * pitch likewise.
 */
export const cube: CubeState = { ...CUBE_REST };
