"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { useDeviceProfile } from "@/lib/perf";
import { bus } from "@/lib/bus";
import { initLock } from "@/lib/lock";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Work } from "@/components/site/work";
import { Method } from "@/components/site/method";
import { Care } from "@/components/site/care";
import { Closing } from "@/components/site/closing";
import { Intake } from "@/components/site/intake";
import { gsap, ScrollTrigger } from "@/lib/gsap";

// Start fetching the WebGL chunk while React is still hydrating, instead of after
// the first client render decides it is wanted. The head script has already ruled
// on lite by the time this module runs (html.js present, no data-lite), and the
// bundler hands next/dynamic below the same chunk, so nothing loads twice. Next
// folds `typeof window` at build time, so the server bundle never sees this.
if (typeof window !== "undefined") {
  const root = document.documentElement;
  if (root.classList.contains("js") && !root.hasAttribute("data-lite")) {
    import("@/components/site/stage").catch(() => {});
  }
}

const Stage = dynamic(() => import("@/components/site/stage").then((module) => module.Stage), { ssr: false });

/**
 * The server HTML carries the short layouts (Work's stack, Method's diagram
 * rows). On a desktop the orbit and the story swap in right after hydration and
 * push everything below them ~3000px down, after the browser has already
 * scrolled to the URL's #hash. Land on it again, once, instantly. Only on a
 * fresh navigation: a reload or back/forward restores its own position.
 */
function landOnHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav && nav.type !== "navigate") return;
  let target: HTMLElement | null = null;
  try {
    target = document.getElementById(decodeURIComponent(hash));
  } catch {
    return; // A malformed %-escape: not one of ours.
  }
  // "instant" beats html's scroll-behavior: smooth; Lenis follows the native jump.
  target?.scrollIntoView({ behavior: "instant", block: "start" });
}

const subscribeNever = () => () => {};

/** False on the server and during hydration, true from the first client commit on. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

export default function HomePage() {
  const [intakeOpen, setIntakeOpen] = useState(false);
  const { lite } = useDeviceProfile();
  const hydrated = useHydrated();
  const openIntake = useCallback(() => setIntakeOpen(true), []);
  const closeIntake = useCallback(() => setIntakeOpen(false), []);

  // Once per page: the shared entrance observer, and one ScrollTrigger refresh
  // after the display face swaps in (it is wider than its fallback, so headings
  // rewrap and every trigger below them moves). Then a shared /#care link gets
  // its landing re-done, unless the visitor has already started moving.
  useEffect(() => {
    bus.scrollY = window.scrollY;
    const releaseLock = initLock();
    let alive = true;
    let touched = false;
    const touch = () => {
      touched = true;
    };
    const intents = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    intents.forEach((type) => window.addEventListener(type, touch, { passive: true }));
    // Only once that refresh has finished, and a frame later: mid-refresh
    // ScrollTrigger parks the page at 0 and measures, so a jump made then lands
    // on a transient layout and ScrollTrigger restores the wrong spot.
    let frame = 0;
    const land = () => {
      ScrollTrigger.removeEventListener("refresh", land);
      frame = requestAnimationFrame(() => {
        if (alive && !touched) landOnHash();
      });
    };
    document.fonts?.ready.then(() => {
      if (!alive) return;
      if (window.location.hash) ScrollTrigger.addEventListener("refresh", land);
      ScrollTrigger.refresh();
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      ScrollTrigger.removeEventListener("refresh", land);
      intents.forEach((type) => window.removeEventListener(type, touch));
      releaseLock();
    };
  }, []);

  // The head script's data-lite is a first guess; the live hook wins after a
  // resize or rotation. Skipped during hydration, when the hook still reports its
  // server placeholder (lite) and would flash the lite treatment on a desktop.
  // Also restores html.js, which React drops on a development StrictMode remount.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.add("js");
    root.toggleAttribute("data-lite", lite);
  }, [hydrated, lite]);

  // The Stage renders nothing while the intake drawer covers the page.
  useEffect(() => {
    bus.paused = intakeOpen;
  }, [intakeOpen]);

  useEffect(() => {
    if (lite || intakeOpen) return;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true, autoToggle: true });
    bus.scrollY = window.scrollY;

    // One clock for the page: GSAP's ticker drives Lenis, each Lenis scroll
    // publishes the position for the Stage and updates ScrollTrigger, then GSAP's
    // own tweens run, then the Stage. Prioritized (third argument) so Lenis stays
    // first even when it is re-created after the intake closes, behind a Stage
    // tick that was added earlier.
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", (instance) => {
      bus.scrollY = instance.scroll;
      ScrollTrigger.update();
    });
    gsap.ticker.add(tick, false, true);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [lite, intakeOpen]);

  return (
    <>
      <div aria-hidden className="sky" />
      {!lite ? <Stage /> : null}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-[2px] focus:bg-ember focus:px-5 focus:py-3 focus:text-[14px] focus:font-medium focus:text-ink"
      >
        Skip to content
      </a>

      <Nav onStart={openIntake} />

      <main id="main">
        <Hero onStart={openIntake} />
        <Work />
        <Method />
        <Care />
      </main>

      <Closing onStart={openIntake} />
      <Intake open={intakeOpen} onClose={closeIntake} />
    </>
  );
}
