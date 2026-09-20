"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

/**
 * Shared motion primitives. Every animation on the site is transform or opacity
 * only, so the compositor does the work and scrolling stays smooth.
 */

export const SETTLE = [0.22, 1, 0.36, 1] as const;

/** Lifts content into place once, when it first arrives. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.85, ease: SETTLE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Headline text that rises word by word out of a mask.
 *
 * The words are real text with real spaces, and the mask carries padding that is
 * cancelled by a negative margin — without it, tall glyphs and descenders get
 * sliced flat by the overflow clip. Screen readers get the plain sentence from the
 * heading's own aria-label; this layer is hidden from them.
 */
export function WordReveal({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  immediate = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const settled = { y: "0%" };

  return (
    <span aria-hidden className={`block ${className ?? ""}`}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="-mb-[0.14em] -mt-[0.18em] inline-block overflow-hidden pb-[0.14em] pt-[0.18em] align-bottom">
            <motion.span
              className="inline-block"
              initial={reduce ? false : { y: "106%" }}
              {...(immediate
                ? { animate: settled }
                : { whileInView: settled, viewport: { once: true, margin: "0px 0px -10% 0px" } })}
              transition={{ duration: 1, ease: SETTLE, delay: delay + i * stagger }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

/** A hairline that draws itself left to right when it arrives. */
export function RuleDraw({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={`rule-draw ${className ?? ""}`}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: SETTLE }}
    />
  );
}

/** Numbered section header: index, label, rule. */
export function SectionHead({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-5">
      <span className="font-mono text-[10px] tracking-[0.32em] text-ember">{index}</span>
      <span className="eyebrow">{label}</span>
      <RuleDraw className="h-px flex-1" />
    </div>
  );
}

type MagneticProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: "ember" | "ghost";
  ariaLabel?: string;
  disabled?: boolean;
};

/**
 * A control that leans toward the cursor — a damped spring, no bounce — with a
 * sheen that crosses it on hover. Disabled entirely under reduced motion.
 */
export function Magnetic({ children, onClick, href, className, variant = "ember", ariaLabel, disabled = false }: MagneticProps) {
  const reduce = useReducedMotion();
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const x = useSpring(dx, { stiffness: 150, damping: 15, mass: 0.6 });
  const y = useSpring(dy, { stiffness: 150, damping: 15, mass: 0.6 });
  const innerX = useTransform(x, (v) => v * 0.3);
  const innerY = useTransform(y, (v) => v * 0.3);

  const onMove = (event: MouseEvent<HTMLElement>) => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    dx.set((event.clientX - (box.left + box.width / 2)) * 0.25);
    dy.set((event.clientY - (box.top + box.height / 2)) * 0.35);
  };
  const reset = () => {
    dx.set(0);
    dy.set(0);
  };

  const skin =
    variant === "ember"
      ? "bg-ember text-ink hover:bg-[#f2b781]"
      : "border border-rule-strong text-bone hover:border-ember/70 hover:text-ember";

  const classes = `group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-3.5 font-mono text-xs uppercase tracking-[0.18em] transition-colors duration-500 ${skin} ${className ?? ""}`;

  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 ease-out group-hover:left-[115%] group-hover:opacity-100"
      />
      <motion.span className="relative inline-flex items-center gap-3" style={reduce ? undefined : { x: innerX, y: innerY }}>
        {children}
      </motion.span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={reduce ? undefined : { x, y }}
        className={classes}
        aria-label={ariaLabel}
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
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={reduce ? undefined : { x, y }}
      className={classes}
      aria-label={ariaLabel}
    >
      {inner}
    </motion.button>
  );
}

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
