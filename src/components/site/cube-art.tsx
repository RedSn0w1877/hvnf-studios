import type { ReactNode } from "react";
import { PARTS, PART_FACES, PART_ORDER, SEGMENTS, SUBSETS, project, type CubePart, type Lattice } from "@/lib/cube";

export type { CubePart };

/**
 * Every cube on the homepage, as static inline SVG drawn from the lattice table
 * in lib/cube. No hooks, no client JS, no CSS of their own: each component
 * renders on the server and costs nothing after first paint.
 *
 *   <HeroCube />            heavy ink beams, bone brace, callout leaders, phone discs
 *   <StepCube state="…" />  the four "How it works" states, white line on cobalt
 *   <PartCube part="…" />   thin ink cube with one numbered part lit in flat ember
 *   <ClosingCube />         the mark as a solid ink block, lines knocked out
 *   <SmallMark />           the 12 lines that survive at nav and footer size
 *
 * Sizing: every cube is `display:block; height:auto` (class .cube in
 * globals.css) and fills its container's width unless you give it one, so set
 * a width with className ("w-[176px]", "w-[58vw]"). The viewBox keeps the ratio,
 * so nothing shifts while it loads.
 *
 * Colours are literal hex on purpose (they are the tokens in globals.css, and
 * the contrast pairs were checked against exactly these values). The small mark
 * is the one exception: it draws in currentColor.
 *
 * Hooks for motion and layout are plain class names on the inner groups, listed
 * on each component. Animate them with transform and opacity only.
 */

/** The palette the drawings are printed in. Same values as the tokens in globals.css. */
export const CUBE_COLORS = {
  ember: "#EF4623",
  ink: "#15120F",
  bone: "#F1EADB",
  cobalt: "#1747D4",
  white: "#FFFFFF",
} as const;

const { ember: EMBER, ink: INK, bone: BONE, white: WHITE } = CUBE_COLORS;

/* ── Geometry ────────────────────────────────────────────────────────────── */

type Point = readonly [x: number, y: number];

const f = (n: number) => Number(n.toFixed(2));
const ALL = SEGMENTS.map((_, i) => i);
const OUTLINE = SUBSETS.outline;
const BRACE = SUBSETS.brace;
const REDLINE = SUBSETS.redline;
const NEAR_Y = SUBSETS.nearY;
const INNER = ALL.filter((i) => !OUTLINE.includes(i));

const without = (list: readonly number[], ...drop: (readonly number[])[]) => {
  const gone = new Set(drop.flat());
  return list.filter((i) => !gone.has(i));
};

const ends = (i: number): [Point, Point] => [project(SEGMENTS[i].p), project(SEGMENTS[i].q)];

/**
 * Path data for a set of segments. Segments that share an endpoint are chained
 * into one polyline first, so corners get a real mitre join instead of two butt
 * ends with a notch between them (which shows at these stroke weights).
 */
function chain(indices: readonly number[]): string {
  const segs = indices.map(ends);
  const key = (p: Point) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const used = new Set<number>();
  const out: string[] = [];
  for (let s = 0; s < segs.length; s++) {
    if (used.has(s)) continue;
    used.add(s);
    const pts: Point[] = [segs[s][0], segs[s][1]];
    let grown = true;
    while (grown) {
      grown = false;
      const head = key(pts[0]);
      const tail = key(pts[pts.length - 1]);
      if (head === tail && pts.length > 2) break; // closed: nothing more can join
      for (let t = 0; t < segs.length; t++) {
        if (used.has(t)) continue;
        const [p, q] = segs[t];
        if (key(p) === tail) pts.push(q);
        else if (key(q) === tail) pts.push(p);
        else if (key(q) === head) pts.unshift(p);
        else if (key(p) === head) pts.unshift(q);
        else continue;
        used.add(t);
        grown = true;
        break;
      }
    }
    const closed = pts.length > 3 && key(pts[0]) === key(pts[pts.length - 1]);
    const body = (closed ? pts.slice(0, -1) : pts).map(([x, y]) => `${f(x)} ${f(y)}`).join(" L");
    out.push(`M${body}${closed ? "Z" : ""}`);
  }
  return out.join(" ");
}

const polygon = (points: readonly Lattice[]) =>
  `M${points.map((p) => project(p).map(f).join(" ")).join(" L")}Z`;

/** The six-sided silhouette, and each part's flat block. */
const HEX = `M${OUTLINE.map((i) => project(SEGMENTS[i].p).map(f).join(" ")).join(" L")}Z`;
const FACE: Record<CubePart, string> = {
  top: polygon(PART_FACES.top),
  left: polygon(PART_FACES.left),
  right: polygon(PART_FACES.right),
  brace: polygon(PART_FACES.brace),
};

/* Path data is worked out once per module load, not per render. */
const D = {
  frame: chain(without(INNER, BRACE)),
  brace: chain(BRACE),
  outline: chain(OUTLINE),
  inner: chain(INNER),
  small: chain([...NEAR_Y, ...BRACE]),
  redline: chain(REDLINE),
  notRedline: chain(without(ALL, REDLINE)),
  // The draft's construction lines: each contour edge run 8 units past both corners.
  overshoot: OUTLINE.map((i) => {
    const [p, q] = ends(i);
    const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const ux = ((q[0] - p[0]) / length) * 8;
    const uy = ((q[1] - p[1]) / length) * 8;
    return `M${f(p[0] - ux)} ${f(p[1] - uy)} L${f(q[0] + ux)} ${f(q[1] + uy)}`;
  }).join(" "),
  part: Object.fromEntries(
    PART_ORDER.map((part) => [
      part,
      {
        all: chain(PARTS[part]),
        rest: chain(without(ALL, PARTS[part])),
        inner: chain(without(PARTS[part], OUTLINE)),
        edge: chain(PARTS[part].filter((i) => OUTLINE.includes(i))),
      },
    ]),
  ) as Record<CubePart, { all: string; rest: string; inner: string; edge: string }>,
};
const REDLINE_DOTS = REDLINE.flatMap(ends).map(([x, y]) => [f(x), f(y)] as const);

/* ── Shared shell ────────────────────────────────────────────────────────── */

/** The cube's box in the logo's 256 master units: x, y, width, height. */
export const CUBE_VIEWBOX = { x: 40, y: 28, w: 176, h: 200 } as const;
const VB_CUBE = "40 28 176 200";
const VB_STEP = "32 20 192 216"; // roomier: the draft's construction lines overshoot
const VB_SMALL = "36 24 184 208";

type ArtProps = {
  /** Sizing and placement. The drawing is decoration unless `label` is set. */
  className?: string;
  /** Set it and the drawing is an image with this accessible name. */
  label?: string;
};

function Art({
  viewBox,
  name,
  className,
  label,
  children,
}: ArtProps & { viewBox: string; name: string; children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      strokeLinejoin="miter"
      strokeMiterlimit={4}
      focusable="false"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className ? `cube ${name} ${className}` : `cube ${name}`}
    >
      {children}
    </svg>
  );
}

/* ── 1. Hero ─────────────────────────────────────────────────────────────── */

export type CalloutAlign = "bc" | "lc" | "tl" | "rc";

/**
 * The four hero callouts, in page order (1 top, 2 left, 3 right, 4 brace), in
 * viewBox units. `anchor` is where the leader leaves its HTML label and `dot`
 * is where it lands on the part. `align` says which point of the label sits on
 * the anchor: bc bottom-centre, lc left-centre, tl top-left, rc right-centre.
 * `disc` is the centre of the numbered disc the phone layout shows instead.
 */
export const HERO_CALLOUTS: readonly {
  part: CubePart;
  align: CalloutAlign;
  anchor: Point;
  dot: Point;
  disc: Point;
}[] = [
  { part: "top", align: "bc", anchor: [94, 38.6], dot: [94, 59.6], disc: [128, 76] },
  { part: "left", align: "lc", anchor: [64, 139.6], dot: [52, 139.6], disc: [84, 138] },
  { part: "right", align: "tl", anchor: [135, 167.2], dot: [135, 160.6], disc: [172, 162] },
  { part: "brace", align: "rc", anchor: [37.9, 172], dot: [93.3, 172], disc: [142, 143.8] },
];

/**
 * Where a viewBox point lands on the page when the hero cube is `width` wide
 * with its top-left corner at (`left`, `top`). All four numbers share one unit
 * (the mock uses vw: width 58, left 54.5, top 9) and so does the answer, so an
 * HTML label placed with it stays glued to the drawing at any width.
 *
 *   const { x, y } = cubePoint(HERO_CALLOUTS[0].anchor, { width: 58, left: 54.5, top: 9 });
 *   <li style={{ left: `${x}vw`, top: `${y}vw` }} />
 */
export function cubePoint(point: Point, frame: { width: number; left: number; top: number }): { x: number; y: number } {
  const k = frame.width / CUBE_VIEWBOX.w;
  return {
    x: f(frame.left + (point[0] - CUBE_VIEWBOX.x) * k),
    y: f(frame.top + (point[1] - CUBE_VIEWBOX.y) * k),
  };
}

export type HeroCubeProps = ArtProps & {
  /** Leader lines and landing dots for the desktop callouts. Default true. */
  leaders?: boolean;
  /** Numbered discs on the parts, for the phone key. Default true. */
  discs?: boolean;
  /** A bone copy of each part's beams, invisible until lit. Default true. */
  highlights?: boolean;
};

/**
 * The poster cube: heavy ink beams, the brace in bone. Meant to be cropped by
 * the hero's frame (overflow is visible, so the leaders can leave the viewBox).
 *
 * Inner groups, all optional:
 *  - g.cube-hl[data-part]      bone copy of one part's beams, opacity 0. Light it
 *                              by putting data-lit="top|left|right|brace" on any
 *                              ancestor (rule in globals.css), or with your own
 *                              :has() selector.
 *  - g.cube-leaders            all four leaders. Each g.cube-leader[data-part]
 *                              has its transform-origin on its landing dot, so
 *                              a scale animation grows the line out of the dot.
 *  - g.cube-discs              the four numbered discs, each g.cube-disc[data-part].
 * Show leaders on desktop and discs on phones with CSS on those two groups.
 */
export function HeroCube({ leaders = true, discs = true, highlights = true, ...art }: HeroCubeProps) {
  return (
    <Art viewBox={VB_CUBE} name="cube-hero" {...art}>
      <path d={D.frame} stroke={INK} strokeWidth={2.5} />
      <path d={D.brace} stroke={BONE} strokeWidth={2.5} />
      <path d={D.outline} stroke={INK} strokeWidth={3.6} />
      {highlights
        ? PART_ORDER.map((part) => (
            <g key={part} className="cube-hl" data-part={part} stroke={part === "brace" ? WHITE : BONE}>
              {D.part[part].inner ? <path d={D.part[part].inner} strokeWidth={2.5} /> : null}
              {D.part[part].edge ? <path d={D.part[part].edge} strokeWidth={3.6} /> : null}
            </g>
          ))
        : null}
      {leaders ? (
        <g className="cube-leaders">
          {HERO_CALLOUTS.map(({ part, anchor, dot }) => {
            const line = `M${anchor[0]} ${anchor[1]} L${dot[0]} ${dot[1]}`;
            return (
              <g key={part} className="cube-leader" data-part={part} style={{ transformOrigin: `${dot[0]}px ${dot[1]}px` }}>
                {/* An ember halo under the hairline, so it cuts cleanly across the black beams. */}
                <path d={line} stroke={EMBER} strokeWidth={2.6} />
                <path d={line} stroke={INK} strokeWidth={0.56} />
                <circle cx={dot[0]} cy={dot[1]} r={1.75} fill={BONE} stroke={INK} strokeWidth={0.7} />
              </g>
            );
          })}
        </g>
      ) : null}
      {discs ? (
        <g className="cube-discs">
          {HERO_CALLOUTS.map(({ part, disc: [x, y] }, i) => (
            <g key={part} className="cube-disc" data-part={part} style={{ transformOrigin: `${x}px ${y}px` }}>
              <circle cx={x} cy={y} r={8.6} fill={BONE} stroke={INK} strokeWidth={1.6} />
              <text x={x} y={y + 4.1} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={INK} className="font-display">
                {i + 1}
              </text>
            </g>
          ))}
        </g>
      ) : null}
    </Art>
  );
}

/* ── 2. How it works: four states of one drawing ─────────────────────────── */

export type StepState = "draft" | "changes" | "built" | "yours";

/**
 * One state of the drawing, white line on cobalt (never put it on another
 * colour: "changes" relies on a white casing to hold ember against the blue).
 *
 *  - draft:   dashed, with overshooting construction lines
 *  - changes: solid, six members struck through in ember. g.cube-redline holds
 *             the strokes and g.cube-dots the twelve end dots (circle.cube-dot,
 *             each with its transform-origin on its own centre, ready to pop).
 *  - built:   fully built in heavy white beams
 *  - yours:   the hero cube in miniature: ember fill, ink beams, bone brace
 */
export function StepCube({ state, ...art }: ArtProps & { state: StepState }) {
  return (
    <Art viewBox={VB_STEP} name={`cube-step cube-step-${state}`} {...art}>
      {state === "draft" ? (
        <>
          <path d={D.overshoot} stroke={WHITE} strokeWidth={1.6} />
          <path d={D.inner} stroke={WHITE} strokeWidth={1.6} strokeDasharray="3.6 2.6" />
        </>
      ) : null}
      {state === "changes" ? (
        <>
          <path d={D.notRedline} stroke={WHITE} strokeWidth={1.6} />
          <g className="cube-redline">
            <path d={D.redline} stroke={WHITE} strokeWidth={5.4} />
            <path d={D.redline} stroke={EMBER} strokeWidth={3.6} />
          </g>
          <g className="cube-dots" fill={EMBER} stroke={WHITE} strokeWidth={1}>
            {REDLINE_DOTS.map(([x, y], i) => (
              <circle key={i} className="cube-dot" cx={x} cy={y} r={3} style={{ transformOrigin: `${x}px ${y}px` }} />
            ))}
          </g>
        </>
      ) : null}
      {state === "built" ? (
        <>
          <path d={D.inner} stroke={WHITE} strokeWidth={2.5} />
          <path d={D.outline} stroke={WHITE} strokeWidth={3.6} />
        </>
      ) : null}
      {state === "yours" ? (
        <>
          <path d={HEX} fill={EMBER} />
          <path d={D.frame} stroke={INK} strokeWidth={2.5} />
          <path d={D.brace} stroke={BONE} strokeWidth={2.5} />
          <path d={D.outline} stroke={INK} strokeWidth={3.6} />
        </>
      ) : null}
    </Art>
  );
}

/* ── 3. What you get: one part lit ───────────────────────────────────────── */

/**
 * A thin ink cube with one part filled flat ember and its own lines thickened.
 * For bone (or any light) ground. path.cube-fill is the ember block, so a
 * section can fade it in a beat after the outline.
 */
export function PartCube({ part, ...art }: ArtProps & { part: CubePart }) {
  return (
    <Art viewBox={VB_CUBE} name={`cube-part cube-part-${part}`} {...art}>
      <path className="cube-fill" d={FACE[part]} fill={EMBER} />
      <path d={D.part[part].rest} stroke={INK} strokeWidth={1.5} />
      <path d={D.part[part].all} stroke={INK} strokeWidth={2.9} />
    </Art>
  );
}

/* ── 4. Closing ──────────────────────────────────────────────────────────── */

/** The mark as a solid ink block on ember: lines knocked out in ember, brace in bone. */
export function ClosingCube(art: ArtProps) {
  return (
    <Art viewBox={VB_CUBE} name="cube-closing" {...art}>
      <path d={HEX} fill={INK} stroke={INK} strokeWidth={3.6} />
      <path d={D.frame} stroke={EMBER} strokeWidth={1.6} />
      <path d={D.brace} stroke={BONE} strokeWidth={2.2} />
    </Art>
  );
}

/* ── 5. Nav and footer ───────────────────────────────────────────────────── */

/**
 * The small mark: contour, near corner and brace, the 12 lines that survive at
 * 24 to 40px. Draws in currentColor, so it takes the text colour around it
 * (ink in the nav, bone in the footer).
 */
export function SmallMark(art: ArtProps) {
  return (
    <Art viewBox={VB_SMALL} name="cube-small" {...art}>
      <path d={D.small} stroke="currentColor" strokeWidth={7} />
      <path d={D.outline} stroke="currentColor" strokeWidth={9} />
    </Art>
  );
}
