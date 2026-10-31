"use client";

import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/**
 * Shared primitives. Every animation on the site is transform or opacity only,
 * so the compositor does the work and scrolling stays smooth. Entrances are not
 * in here any more: they are CSS (data-lock, .load-a/b/c in globals.css) driven
 * by one shared observer (lib/lock.ts).
 */

export const SETTLE = [0.22, 1, 0.36, 1] as const;

type HeadingTag = "h1" | "h2" | "h3";

/**
 * A section heading, printed once, in a wrapper div.
 *
 *  - trigger="load": no animation of any kind. Use it for the h1, which has to
 *    be on screen, static, from first paint (it is the LCP element).
 *  - trigger="view": the wrapper carries data-lock="b" and slides in with the
 *    axis lock when it reaches the screen, after `delay` ms.
 *
 * `className` styles the heading. Placement in a parent grid or outer spacing
 * goes on `wrapperClassName`. `tone` changes nothing any more (it coloured the
 * old registration ghost); it stays so no call site has to change.
 */
export function RegisteredHeading({
  as: Tag = "h2",
  trigger,
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
    <div className={wrapperClassName} data-lock={trigger === "view" ? "b" : undefined} style={style}>
      <Tag id={id} className={className}>
        {children}
      </Tag>
    </div>
  );
}

/**
 * The small ember diamond the intake uses as its selected marker. 6×7,
 * decorative. On paper it switches to ember-ink, the only orange that reads
 * there. `className` is for placement (margins, alignment), not colour.
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

/**
 * The Beam: the site's one button, as a <button> or, with href, an <a>.
 *
 * A chamfered fill (the clip lives on the fill span, so focus rings are never
 * clipped) that lifts flat on hover or keyboard focus; the link variant grows an
 * ember underline instead. All of it is CSS in globals.css: the control itself
 * never moves, and no JS runs while a pointer is over it.
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
  const solid = variant === "ember" || variant === "solid";
  const classes = className ? `beam ${className}` : "beam";
  const kind = solid ? "solid" : "link";

  const inner = (
    <>
      {solid ? <span aria-hidden className="beam-fill" /> : null}
      <span className="relative inline-flex items-center gap-2.5">
        {children}
        {solid ? null : <span aria-hidden className="beam-ul" />}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={classes}
        aria-label={ariaLabel}
        data-variant={kind}
        data-size={size}
        data-tone={tone}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
      data-variant={kind}
      data-size={size}
      data-tone={tone}
    >
      {inner}
    </button>
  );
}

/** The spec's name for Magnetic. Same component, same props. */
export const Beam = Magnetic;

/**
 * Card that tilts a little toward the cursor. Pure transform, no layout work.
 * On its way out: Work's stack stops using it, and it goes once nothing imports it.
 */
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
