"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { Menu, X } from "lucide-react";
import { Magnetic, SETTLE } from "./kit";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#method", label: "Method" },
  { href: "#care", label: "Care" },
] as const;

/**
 * The header. Solid carbon, a hairline under it, and a progress thread along the
 * bottom edge. It steps out of the way when you scroll down and returns the moment
 * you scroll up. No backdrop blur — a frosted bar over a live WebGL background is
 * an expensive way to make text harder to read.
 */
export function Nav({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [active, setActive] = useState<string>("");
  const lastY = useRef(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  // One passive listener, rAF-throttled: no layout reads on the scroll path.
  useEffect(() => {
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const y = window.scrollY;
        setLifted(y > 16);
        setHidden(y > 240 && y > lastY.current);
        lastY.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Which section owns the viewport middle.
  useEffect(() => {
    const targets = LINKS.map((l) => document.querySelector(l.href)).filter(Boolean) as Element[];
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden && !open ? "-100%" : "0%" }}
      transition={{ duration: 0.5, ease: SETTLE }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        lifted || open ? "border-b border-rule bg-carbon/95" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-6">
        <a href="#top" className="group flex items-baseline gap-2.5" aria-label="HVNF Studios, back to top">
          <span className="font-mono text-sm font-semibold tracking-tight text-bone">HVNF</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted transition-colors group-hover:text-ember">
            Studios
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
                className={`relative px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  on ? "text-bone" : "text-muted hover:text-ash"
                }`}
              >
                {link.label}
                {on ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-px h-px bg-ember"
                    transition={{ duration: 0.5, ease: SETTLE }}
                  />
                ) : null}
              </a>
            );
          })}
          <Magnetic onClick={onStart} className="ml-3 !px-5 !py-2.5">
            Start a project
          </Magnetic>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-rule text-bone md:hidden"
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </div>

      {/* Progress thread */}
      <motion.div
        aria-hidden
        style={{ scaleX: reduce ? 0 : progress }}
        className="h-px origin-left bg-gradient-to-r from-ember via-ember/60 to-transparent"
      />

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-sheet"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: SETTLE }}
            className="border-t border-rule bg-carbon md:hidden"
          >
            <div className="shell flex flex-col gap-1 py-6">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-rule py-4 text-2xl font-semibold tracking-tight text-bone"
                >
                  {link.label}
                </a>
              ))}
              <Magnetic
                onClick={() => {
                  setOpen(false);
                  onStart();
                }}
                className="mt-6 w-full justify-center"
              >
                Start a project
              </Magnetic>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
