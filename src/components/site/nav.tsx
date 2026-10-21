"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { Menu, X } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CubeMark } from "./cube-mark";
import { Beam, SETTLE } from "./kit";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#method", label: "How it works" },
  { href: "#care", label: "What you get" },
] as const;

// The mark in the corner is a dial: each chapter that reaches the middle of the
// screen lights more of its six contour edges. #closing is the footer. Only the
// furthest chapter counts, so scrolling back up never empties it.
const CHAPTERS: Record<string, number> = { "#top": 1, "#work": 3, "#method": 4, "#care": 5, "#closing": 6 };

// The bar steps aside only once you are properly into the page, and picks up its
// carbon backing as soon as anything can scroll under it.
const HIDE_AFTER = 240;
const LIFT_AFTER = 16;

// The sheet's links arrive along the cube's A axis, at the 70% travel every
// entrance uses below 768px (the sheet only exists there), 50ms apart.
const sheetList: Variants = {
  shown: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const sheetItem: Variants = {
  hidden: { opacity: 0, x: -8.4, y: 4.9 },
  shown: { opacity: 1, x: 0, y: 0, transition: { duration: 0.64, ease: SETTLE } },
};

/**
 * The header. A hairline thread along its bottom edge tracks how far down the
 * page you are; it steps out of the way when you scroll down and returns the
 * moment you scroll up. No backdrop blur: a frosted bar over a live WebGL
 * canvas is an expensive way to make text harder to read.
 *
 * Nothing here listens to scroll. Two ScrollTriggers ride the page's one clock
 * (Lenis, then ScrollTrigger, on gsap's ticker): the thread is a quickSetter
 * write per frame, and React only hears about it when the bar should hide,
 * show, or lift.
 */
export function Nav({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [active, setActive] = useState<string>("");
  const [reached, setReached] = useState(1);
  const header = useRef<HTMLElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  // What the bar is doing right now, readable from the trigger without waiting
  // on a render, so state is only set when the answer actually changes.
  const hiding = useRef(false);
  const reduce = useReducedMotion();

  useGSAP(
    () => {
      const line = thread.current;
      if (!line) return;
      const setThread = gsap.quickSetter(line, "scaleX") as (progress: number) => void;

      // Direction comes from the scroll position itself, not from progress. A
      // refresh (the display face swapping in, Work's orbit becoming a stack)
      // moves progress while nobody scrolls, and so does this trigger's own
      // first pass on a page restored halfway down; neither may hide the bar.
      let lastY: number | null = null;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate(self) {
          setThread(self.progress);
          const y = self.scroll();
          const moved = lastY === null ? 0 : y - lastY;
          lastY = y;
          if (moved === 0) return;
          const hide = moved > 0 && y > HIDE_AFTER;
          if (hide === hiding.current) return;
          hiding.current = hide;
          setHidden(hide);
        },
      });

      // Enter/leave-back rather than onToggle: a toggle trigger reports itself
      // inactive at progress 1, which would drop the backing at the very bottom.
      ScrollTrigger.create({
        start: LIFT_AFTER,
        end: "max",
        onEnter: () => setLifted(true),
        onLeaveBack: () => setLifted(false),
      });
    },
    { scope: header },
  );

  // Which section owns the viewport middle, and how far the dial has got.
  useEffect(() => {
    const targets = Object.keys(CHAPTERS)
      .map((selector) => document.querySelector(selector))
      .filter((target): target is Element => target !== null);
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = `#${entry.target.id}`;
          setActive(id);
          setReached((n) => Math.max(n, CHAPTERS[id] ?? 0));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  // Escape closes the mobile sheet; the page never scrolls behind it.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus({ preventScroll: true });
      }
      if (e.key !== "Tab") return;
      const controls = Array.from(header.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])
        .filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      media.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header
      ref={header}
      onFocusCapture={() => {
        hiding.current = false;
        setHidden(false);
      }}
      className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-settle ${
        hidden && !open ? "-translate-y-full" : ""
      }`}
    >
      {/*
        The lifted backing is its own layer that fades in, so lifting the bar is
        an opacity change rather than a background repaint.
      */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-10 border-b border-rule bg-carbon/95 transition-opacity duration-500 ease-settle ${
          lifted || open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="shell flex h-16 items-center justify-between gap-6">
        <a href="#top" className="group flex min-h-11 items-center gap-3" aria-label="HVNF Studios, back to top">
          {/*
            On hover or focus the brace nudges 2 screen px along its own axis,
            (.866, -.5): 2 × 256/28 viewBox units, since a CSS translate on an
            SVG <g> is measured in user units.
          */}
          <CubeMark
            size={28}
            dial={reached}
            className="shrink-0 [&_.cm-brace]:transition-transform [&_.cm-brace]:duration-[260ms] [&_.cm-brace]:ease-settle group-hover:[&_.cm-brace]:[transform:translate(15.84px,-9.14px)] group-focus-visible:[&_.cm-brace]:[transform:translate(15.84px,-9.14px)]"
          />
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[15px] font-semibold tracking-[0.04em] text-bone">HVNF</span>
            <span className="text-[13px] font-medium text-muted">Studios</span>
          </span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const on = active === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={on ? "true" : undefined}
                className={`relative px-4 py-2 text-sm font-medium ${on ? "text-bone" : "text-muted hover:text-ash"}`}
              >
                {link.label}
                {on ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-4 -bottom-px h-0.5 bg-ember"
                    transition={reduce ? { duration: 0 } : { duration: 0.5, ease: SETTLE }}
                  />
                ) : null}
              </a>
            );
          })}
          <Beam onClick={onStart} size="sm" className="ml-4">
            Start a project
          </Beam>
        </nav>

        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center border border-rule-strong text-bone md:hidden"
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </div>

      {/*
        Progress thread: 1px of ember, scaled by the trigger above. It starts at
        zero in the server HTML; React never rewrites this style after gsap
        takes it over, because the prop itself never changes.
      */}
      <div
        ref={thread}
        aria-hidden
        className="h-px origin-left bg-ember motion-reduce:hidden"
        style={{ transform: "scaleX(0)" }}
      />

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: SETTLE }}
            className="border-t border-rule bg-carbon md:hidden"
          >
            <motion.div
              variants={sheetList}
              initial={reduce ? false : "hidden"}
              animate="shown"
              className="shell flex flex-col py-6"
            >
              {LINKS.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  variants={sheetItem}
                  onClick={() => setOpen(false)}
                  className="border-b border-rule py-4 font-display text-[28px] font-semibold leading-tight tracking-[-0.012em] text-bone"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div variants={sheetItem} className="mt-8">
                <Beam
                  onClick={() => {
                    setOpen(false);
                    onStart();
                  }}
                  className="w-full"
                >
                  Start a project
                </Beam>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
