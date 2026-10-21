/**
 * The HVNF cube as data: the one table every renderer reads.
 *
 * The logo is an isometric drawing of a 6×6×6 lattice frame. Every line in the
 * SVG master (brand/hvnf-blueprint/hvnf-blueprint-transparent.svg) is a segment
 * between two lattice points (a, b, c), so these 39 rows draw the inline SVG
 * marks, the favicon and the WebGL beams alike. Nobody hand-copies coordinates.
 *
 * Axes: a runs down-right on screen, b down-left, c straight up. A step along
 * (1,1,1) projects to nothing at the true isometric angle. That blind direction
 * is the paradox lever: the 3D cube can scatter in depth and still read as the
 * flat logo, until the camera leaves the one angle where it lines up.
 *
 * No React, no DOM, and only what the SVG marks need: this module ships in the
 * main chunk (every CubeMark imports it). The Stage's 3D side (seeded depth,
 * jitter, normals, the live `cube` state) lives in components/site/cube-3d.ts,
 * which only the lazy Stage chunk imports, so lite visitors never download it.
 */

export type Lattice = readonly [a: number, b: number, c: number];
/** Which lattice coordinate a segment runs along. The brace runs along all three. */
export type Axis = "a" | "b" | "c" | "brace";

/* ── Projection ──────────────────────────────────────────────────────────── */

/** SVG units per lattice step, horizontally: 8·√3, to the master's 5 decimals. */
const ISO_X = 13.85641;

/** Lattice point → SVG master coordinates (256 viewBox, y down). */
export function project([a, b, c]: Lattice): [x: number, y: number] {
  return [128 + ISO_X * (a - b), 128 + 8 * (a + b) - 16 * c];
}

/* ── The table ───────────────────────────────────────────────────────────── */

// [p, q] in SVG path order. 0–32 are the 1-unit interior lines; 33–38 are the
// 1.5-unit hexagonal contour, clockwise from the top vertex. The gaps in 1/2 and
// 4/5 are authored clearance where the brace passes "through" the front uprights:
// they stay, because they are what gives the drawing away when the cube turns.
const TABLE: readonly (readonly [Lattice, Lattice])[] = [
  [[0, 1, 4], [0, 1, 2]], //     0
  [[5, 6, 5], [5, 6, 4.2]], //   1
  [[5, 6, 2.8], [5, 6, 1]], //   2
  [[1, 1, 6], [1, 1, 2]], //     3
  [[6, 6, 6], [6, 6, 5.2]], //   4
  [[6, 6, 3.8], [6, 6, 0]], //   5
  [[1, 0, 4], [1, 0, 2]], //     6
  [[6, 5, 3.8], [6, 5, 1]], //   7
  [[0, 4, 1], [0, 2, 1]], //     8
  [[5, 5, 6], [5, 1, 6]], //     9
  [[1, 6, 1], [1, 2, 1]], //    10
  [[6, 6, 6], [6, 0, 6]], //    11
  [[1, 4, 5], [1, 1, 5]], //    12
  [[1, 5, 6], [1, 1, 6]], //    13
  [[1, 6, 5], [1, 6, 1]], //    14
  [[1, 5, 4], [1, 5, 1]], //    15
  [[0, 6, 6], [6, 6, 6]], //    16
  [[3, 1, 1], [6, 1, 1]], //    17
  [[1, 5, 6], [5, 5, 6]], //    18
  [[3, 0, 1], [4, 0, 1]], //    19
  [[1, 6, 5], [5, 6, 5]], //    20
  [[2, 1, 0], [4, 1, 0]], //    21
  [[1, 1, 5], [4, 1, 5]], //    22
  [[1, 1, 6], [5, 1, 6]], //    23
  [[1, 5, 1], [2, 5, 1]], //    24
  [[3, 5, 1], [4, 5, 1]], //    25
  [[1, 6, 1], [5, 6, 1]], //    26
  [[5, 1, 4], [5, 1, 1]], //    27
  [[6, 1, 5], [6, 1, 1]], //    28
  [[5, 4, 1], [5, 1, 1]], //    29
  [[6, 5, 1], [6, 1, 1]], //    30
  [[2, 6, 1], [6, 1, 5]], //    31  brace
  [[3, 6, 1], [6, 2, 4]], //    32  brace
  [[0, 0, 6], [6, 0, 6]], //    33  contour
  [[6, 0, 6], [6, 0, 0]], //    34
  [[6, 0, 0], [6, 6, 0]], //    35
  [[6, 6, 0], [0, 6, 0]], //    36
  [[0, 6, 0], [0, 6, 6]], //    37
  [[0, 6, 6], [0, 0, 6]], //    38
];

/* ── Subsets ─────────────────────────────────────────────────────────────── */

const OUTLINE = [33, 34, 35, 36, 37, 38];
const BRACE = [31, 32];
const REDLINE = [8, 12, 18, 22, 26, 29];
// The near "Y" every cube icon has: two top edges meeting at the front corner,
// plus the front upright (with its clearance gap) running down from it.
const NEAR_Y = [11, 16, 4, 5];

function axisOf([p, q]: readonly [Lattice, Lattice]): Axis {
  const moves = [0, 1, 2].filter((k) => p[k] !== q[k]);
  return moves.length === 1 ? (["a", "b", "c"] as const)[moves[0]] : "brace";
}

const AXES = TABLE.map(axisOf);
// Every vertical inside the contour, derived rather than listed: 0–7, 14, 15, 27, 28.
const VERTICALS = AXES.flatMap((axis, i) => (axis === "c" && !OUTLINE.includes(i) ? [i] : []));

export type CubeSubset = "outline" | "uprights" | "centerUpright" | "brace" | "redline" | "nearY" | "nearCorner";

/** Segment index lists. `small` is the cut used at icon sizes: the 12 lines that survive at 28px. */
export const SUBSETS: Readonly<Record<CubeSubset | "small", readonly number[]>> = {
  outline: OUTLINE,
  uprights: VERTICALS,
  centerUpright: [4, 5],
  brace: BRACE,
  redline: REDLINE,
  nearY: NEAR_Y,
  nearCorner: [11, 16, 4],
  small: [...OUTLINE, ...NEAR_Y, ...BRACE],
};

/* ── Segments ────────────────────────────────────────────────────────────── */

export type Segment = {
  readonly p: Lattice;
  readonly q: Lattice;
  /** Stroke weight in master units: 1 interior, 1.5 contour. */
  readonly w: 1 | 1.5;
  readonly axis: Axis;
};

export const SEGMENTS: readonly Segment[] = TABLE.map(([p, q], i) => ({
  p,
  q,
  w: OUTLINE.includes(i) ? 1.5 : 1,
  axis: AXES[i],
}));

/* ── Dev check ───────────────────────────────────────────────────────────── */

// The table is only worth trusting if it still IS the logo. In development,
// reproject every row and compare it against the master's own path data; the
// production build strips this whole block, master strings included.
if (process.env.NODE_ENV !== "production") {
  const interior =
    "M114.14359 72 114.14359 104 M114.14359 136 114.14359 148.82457 M114.14359 171.17543 114.14359 200 " +
    "M128 48 128 112 M128 128 128 140.82457 M128 163.17543 128 224 M141.85641 72 141.85641 104 " +
    "M141.85641 155.17543 141.85641 200 M72.57437 144 100.28719 128 M128 112 183.42563 80 " +
    "M58.71797 168 114.14359 136 M128 128 211.13844 80 M86.43078 88 128 64 M72.57437 80 128 48 " +
    "M58.71797 104 58.71797 168 M72.57437 112 72.57437 160 M44.86156 80 128 128 M155.71281 144 197.28203 168 " +
    "M72.57437 80 128 112 M169.56922 136 183.42563 144 M58.71797 104 114.14359 136 M141.85641 152 169.56922 168 " +
    "M128 64 169.56922 88 M128 48 183.42563 80 M72.57437 160 86.43078 168 M100.28719 176 114.14359 184 " +
    "M58.71797 168 114.14359 200 M183.42563 112 183.42563 160 M197.28203 104 197.28203 168 " +
    "M141.85641 184 183.42563 160 M141.85641 200 197.28203 168 M72.57437 176 197.28203 104 " +
    "M86.43078 184 183.42563 128";
  const contour = "M128 32 211.13844 80 211.13844 176 128 224 44.86156 176 44.86156 80Z";
  const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

  const reference: number[][] = [];
  const lines = numbers(interior);
  for (let i = 0; i < lines.length; i += 4) reference.push(lines.slice(i, i + 4));
  const hex = numbers(contour);
  for (let i = 0; i < 12; i += 2) reference.push([hex[i], hex[i + 1], hex[(i + 2) % 12], hex[(i + 3) % 12]]);

  const drifted = SEGMENTS.flatMap(({ p, q }, i) => {
    const [x1, y1] = project(p);
    const [x2, y2] = project(q);
    const want = reference[i] ?? [];
    const error = Math.max(
      Math.abs(x1 - want[0]),
      Math.abs(y1 - want[1]),
      Math.abs(x2 - want[2]),
      Math.abs(y2 - want[3]),
    );
    return error <= 0.05 ? [] : [i];
  });
  if (reference.length !== SEGMENTS.length || drifted.length > 0) {
    console.error(`[cube] lattice table no longer matches the SVG master (segments: ${drifted.join(", ") || "count"})`);
  }
}
