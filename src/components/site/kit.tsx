"use client";

import { useRef, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

/**
 * Shared primitives. Every animation on the site is transform or opacity only,
 * so the compositor does the work and scrolling stays smooth. Entrances are not
 * in here any more: they are CSS (data-lock, .load-a/b/c in globals.css) driven
 * by one shared observer (lib/lock.ts).
 */

export const SETTLE = [0.22, 1, 0.36, 1] as const;

type HeadingTag = "h1" | "h2" | "h3";

/**
 * A heading printed twice, slightly out of register, that settles into one.
 *
 * The real heading is rendered as-is and never moves, masks or waits: for the h1
 * that keeps LCP at first paint. Over it, in the same grid cell, sits an
 * aria-hidden ghost copy with the same classes, coloured draft (draft-ink on
 * paper), which starts offset along the cube's axis at .55 opacity and converges
 * onto the text while fading to nothing over 720ms.
 *
 *  - trigger="load": pure CSS, 120ms after first paint, no JS. Use for the h1.
 *  - trigger="view": the wrapper carries data-lock="b" and enters with the axis
 *    lock; the ghost plays as it arrives, in step with `delay`.
 *
 * `className` styles the heading (and its ghost). Placement in a parent grid or
 * outer spacing that should not be doubled goes on `wrapperClassName`. Children
 * are rendered twice, so keep them to text and spans: no ids, effects or links.
 * Reduced motion hides the ghost entirely.
 */
export function RegisteredHeading({
  as: Tag = "h2",
  trigger,
  tone = "dark",
  className,
  wrapperClassName,
  delay,
  id,
  children,
}: {
  as?: HeadingTag;
  trigger: "load" | "view";
  tone?: "dark" | "paper";
  className?: string;
  wrapperClassName?: string;
  /** Entrance delay in ms for trigger="view" (sets --ld). */
  delay?: number;
  id?: string;
  children: ReactNode;
}) {
  const style = delay ? ({ "--ld": `${delay}ms` } as CSSProperties) : undefined;
  return (
    <div
      className={wrapperClassName ? `reg ${wrapperClassName}` : "reg"}
      data-reg={trigger}
      data-tone={tone}
      data-lock={trigger === "view" ? "b" : undefined}
      style={style}
    >
      <Tag id={id} className={className}>
        {children}
      </Tag>
      <span aria-hidden data-nosnippet className={className ? `reg-ghost ${className}` : "reg-ghost"}>
        {children}
      </span>
    </div>
  );
}

/**
 * The small ember diamond used as a separator in a run of plain words (the hero's
 * marks line) and as the intake's selected marker. 6×7, decorative. On paper it
 * switches to ember-ink, the only orange that reads there. `className` is for
 * placement (margins, alignment), not colour.
 */
export function IsoRhombus({ tone = "dark", className }: { tone?: "dark" | "paper"; className?: string }) {
  const colour = tone === "paper" ? "text-ember-ink" : "text-ember";
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 6 7"
      width="6"
      height="7"
      fill="currentColor"
      className={className ? `inline-block shrink-0 ${colour} ${className}` : `inline-block shrink-0 ${colour}`}
    >
      <path d="M3 0 6 3.5 3 7 0 3.5Z" />
    </svg>
  );
}

type MagneticProps = {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  href?: string;
  className?: string;
  /** "ember"/"solid": the filled Beam. "link"/"ghost": text with an underline. */
  variant?: "ember" | "solid" | "link" | "ghost";
  /** Heights 40 / 48 / 56px. */
  size?: "sm" | "md" | "lg";
  /** "ember" on dark surfaces; "ink" (paper-ink fill, bone text) on paper. */
  tone?: "ember" | "ink";
  ariaLabel?: string;
  disabled?: boolean;
};

// The cube's three iso axes in screen space: A runs down-right, B down-left,
// C straight down. The pull always travels along one of them.
const AXES = [
  [0.866, 0.5],
  [-0.866, 0.5],
  [0, 1],
] as const;
const PULL = 0.25;
const SPRING = { stiffness: 150, damping: 15, mass: 0.6 };

/**
 * The Beam: the site's one button, as a <button> or, with href, an <a>.
 *
 * A chamfered fill (the clip lives on the fill span, so focus rings are never
 * clipped), two registration ticks that slide in on hover or focus (CSS, in
 * globals.css), and a magnetic lean toward a mouse cursor — a damped spring with
 * no bounce, snapped to whichever iso axis the pointer is furthest along. The
 * control's centre is measured once on pointerenter, never per move. Touch and
 * reduced motion get no lean at all.
 */
export function Magnetic({
  children,
  onClick,
  href,
  className,
  variant = "ember",
  size = "md",
  tone = "ember",
  ariaLabel,
  disabled = false,
}: MagneticProps) {
  const reduce = useReducedMotion();
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const x = useSpring(dx, SPRING);
  const y = useSpring(dy, SPRING);
  const innerX = useTransform(x, (v) => v * 0.3);
  const innerY = useTransform(y, (v) => v * 0.3);
  const centre = useRef<{ x: number; y: number } | null>(null);

  const solid = variant === "ember" || variant === "solid";

  const onEnter = (event: PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    // Measured mid-lean if the spring has not settled yet; take the lean back out.
    centre.current = { x: box.left + box.width / 2 - x.get(), y: box.top + box.height / 2 - y.get() };
  };

  const onMove = (event: PointerEvent<HTMLElement>) => {
    const c = centre.current;
    if (!c) return;
    const px = event.clientX - c.x;
    const py = event.clientY - c.y;
    // Project the offset onto each axis and keep only the longest component.
    let axis: (typeof AXES)[number] = AXES[0];
    let reach = 0;
    for (const candidate of AXES) {
      const along = px * candidate[0] + py * candidate[1];
      if (Math.abs(along) > Math.abs(reach)) {
        reach = along;
        axis = candidate;
      }
    }
    dx.set(axis[0] * reach * PULL);
    dy.set(axis[1] * reach * PULL);
  };

  const onLeave = () => {
    centre.current = null;
    dx.set(0);
    dy.set(0);
  };

  const classes = className ? `beam ${className}` : "beam";
  const kind = solid ? "solid" : "link";
  const lean = reduce ? undefined : { x, y };

  const inner = (
    <>
      {solid ? (
        <>
          <span aria-hidden className="beam-fill" />
          <span aria-hidden className="beam-tick beam-tick-tl" />
          <span aria-hidden className="beam-tick beam-tick-br" />
        </>
      ) : null}
      <motion.span className="relative inline-flex items-center gap-2.5" style={reduce ? undefined : { x: innerX, y: innerY }}>
        {children}
        {solid ? null : <span aria-hidden className="beam-ul" />}
      </motion.span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        onClick={onClick}
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={lean}
        className={classes}
        aria-label={ariaLabel}
        data-variant={kind}
        data-size={size}
        data-tone={tone}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={lean}
      className={classes}
      aria-label={ariaLabel}
      data-variant={kind}
      data-size={size}
      data-tone={tone}
    >
      {inner}
    </motion.button>
  );
}

/** The spec's name for Magnetic. Same component, same props. */
export const Beam = Magnetic;

/** Card that tilts a little toward the cursor. Pure transform, no layout work. */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springX = useSpring(rx, { stiffness: 120, damping: 18 });
  const springY = useSpring(ry, { stiffness: 120, damping: 18 });

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    ry.set(px * 6);
    rx.set(-py * 6);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={reduce ? undefined : { rotateX: springX, rotateY: springY, transformPerspective: 1200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
