import { SEGMENTS, SUBSETS, project, type Axis, type CubeSubset } from "@/lib/cube";
import styles from "./cube-mark.module.css";

export type { CubeSubset };

/**
 * The HVNF cube as inline SVG, drawn straight from the lattice table in
 * lib/cube, so the marks, the favicon and the WebGL Stage can never disagree
 * about what the logo is.
 *
 * Both components are server-renderable: no hooks, no client JS of their own.
 * When a client parent changes a prop (the nav's dial, the intake's build step)
 * React only flips data attributes and CSS fades the lines with opacity.
 */

// One "M x y x y" per segment, the same shape as the master's path data.
// Two decimals is a hundredth of a viewBox unit: invisible, and it keeps the
// server HTML for a page full of marks small.
const round = (v: number) => Math.round(v * 100) / 100;
const SEG_D = SEGMENTS.map(({ p, q }) => {
  const [x1, y1] = project(p);
  const [x2, y2] = project(q);
  return `M${round(x1)} ${round(y1)} ${round(x2)} ${round(y2)}`;
});
const d = (indices: readonly number[]) => indices.map((i) => SEG_D[i]).join("");

const ALL = SEGMENTS.map((_, i) => i);
const EDGES = SUBSETS.outline; // clockwise from the top vertex, so the dial fills like a clock
const BRACE = SUBSETS.brace;
const UPRIGHTS = new Set(SUBSETS.uprights);
const NOT_FRAME = new Set([...EDGES, ...BRACE]);

/** One path per stroke weight: 1-unit interior lines and 1.5-unit contour. */
function lines(indices: readonly number[], inner: number, outer: number) {
  const thin = indices.filter((i) => SEGMENTS[i].w === 1);
  const thick = indices.filter((i) => SEGMENTS[i].w !== 1);
  return (
    <>
      {thin.length > 0 && <path strokeWidth={inner} d={d(thin)} />}
      {thick.length > 0 && <path strokeWidth={outer} d={d(thick)} />}
    </>
  );
}

export type CubeMarkProps = {
  /** Rendered side in px; the 256 viewBox maps onto it. */
  size: number;
  /** `small` keeps the 12 lines that survive at icon sizes. Default: small at ≤48px. */
  cut?: "full" | "small";
  tone?: "dark" | "paper";
  /** draft → redline → build → lock: the four Method steps, as static drawings. */
  state?: "draft" | "redline" | "build" | "lock";
  /** Subsets redrawn on top in the action colour (`.cm-hl`). */
  highlight?: readonly CubeSubset[];
  /** 0–6 contour edges lit; the rest sit at 25%. Unset = all lit. */
  dial?: number;
  /** 0 contour, 1 + uprights, 2 + the rest of the frame, 3 + brace. Unset = all. */
  build?: 0 | 1 | 2 | 3;
  className?: string;
  /** Set it and the mark is an image with this name; leave it and it is decoration. */
  label?: string;
};

export function CubeMark({
  size,
  cut = size <= 48 ? "small" : "full",
  tone = "dark",
  state = "lock",
  highlight,
  dial,
  build,
  className,
  label,
}: CubeMarkProps) {
  const pool = cut === "small" ? SUBSETS.small : ALL;
  const inCut = (i: number) => pool.includes(i);
  const weight = state === "build" ? 1.25 : 1;
  const inner = weight;
  const outer = (cut === "small" ? 1.4 : 1.5) * weight;

  const frame = pool.filter((i) => !NOT_FRAME.has(i));
  const uprights = frame.filter((i) => UPRIGHTS.has(i));
  const rest = frame.filter((i) => !UPRIGHTS.has(i));
  // The redline keeps the draft underneath and marks the correction on top,
  // offset the way a checker's pen would: the original is still legible.
  const red = state === "redline" ? SUBSETS.redline.filter(inCut) : [];
  const lit = highlight ? [...new Set(highlight.flatMap((name) => SUBSETS[name]))].filter(inCut) : [];
  const off = (tier: number) => (build !== undefined && build < tier ? "" : undefined);

  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="none"
      className={[styles.mark, styles[tone], styles[state], className].filter(Boolean).join(" ")}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {label && <title>{label}</title>}
      <g strokeWidth={inner}>
        {uprights.length > 0 && <path data-tier="1" data-off={off(1)} d={d(uprights)} />}
        {rest.length > 0 && <path data-tier="2" data-off={off(2)} d={d(rest)} />}
      </g>
      <g strokeWidth={outer}>
        {EDGES.map((i, n) => (
          <path key={i} className="cm-edge" data-on={dial === undefined || n < dial ? "" : undefined} d={SEG_D[i]} />
        ))}
      </g>
      {state === "lock" && (
        // Opacity lives on the inner path so a consumer can transition the
        // group's transform (the nav's hover nudge) without the two fighting.
        <g className="cm-brace" strokeWidth={inner}>
          <path data-tier="3" data-off={off(3)} d={d(BRACE)} />
        </g>
      )}
      {red.length > 0 && (
        <g className="cm-hl cm-redline" transform="translate(6 -3.5)" strokeWidth={inner}>
          <path d={d(red)} />
        </g>
      )}
      {lit.length > 0 && <g className="cm-hl">{lines(lit, inner, outer)}</g>}
    </svg>
  );
}

// The fallback's four families: every line grouped by the axis it runs along,
// contour edges included, so each family can slide in along its own axis.
const family = (axis: Axis) => ALL.filter((i) => SEGMENTS[i].axis === axis);
const LAYERS = [
  { key: "v", indices: family("c") }, // verticals
  { key: "a", indices: family("a") },
  { key: "b", indices: family("b") },
  { key: "brace", indices: family("brace") },
] as const;

// The slot needs a positioned box for its fallback. Add `relative` unless the
// caller already positions it, since Tailwind's sort would let `relative` beat
// an `absolute` or `fixed` passed in.
const POSITIONED = /(?:^|\s)(?:[\w-]+:)*!?(?:sticky|absolute|fixed)(?=\s|$)/;

export type CubeSlotProps = {
  name: "hero" | "method" | "closing";
  className?: string;
  /** When the lite-path MarkConverge runs: at first paint, or once the slot is in view. */
  play?: "load" | "view";
};

/**
 * Where the cube lives on the page. The Stage measures this box and draws the
 * WebGL cube over it; until it does (or when it never will: lite devices, no
 * JS, a failed context) the slot shows the logo itself, as five stacked SVG
 * layers so each family composites on its own during MarkConverge.
 */
export function CubeSlot({ name, className = "", play = "load" }: CubeSlotProps) {
  const classes = [
    POSITIONED.test(className) ? "" : "relative",
    "aspect-square",
    play === "view" && styles.view,
    name !== "method" && styles.drag,
    className,
  ];
  return (
    <div data-cube-slot={name} data-lock="none" aria-hidden className={classes.filter(Boolean).join(" ")}>
      <div className={styles.fallback}>
        {LAYERS.map(({ key, indices }) => (
          <svg key={key} viewBox="0 0 256 256" fill="none" className={`${styles.layer} ${styles[key]}`}>
            {lines(indices, 1, 1.5)}
          </svg>
        ))}
        <svg viewBox="0 0 256 256" fill="none" className={`${styles.layer} ${styles.ember}`}>
          <path strokeWidth={1} d={d(BRACE)} />
        </svg>
      </div>
    </div>
  );
}
