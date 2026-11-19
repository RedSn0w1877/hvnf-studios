"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Bento } from "./bento";
import { STEPS } from "./demos";
import s from "./portfolio.module.css";

/**
 * The portfolio: four demos, then HVNF's own closing, one bento at a time.
 *
 * How the scroll works. The track is one screen tall per step, with a sticky
 * full-screen stage inside it. Under the stage sit five invisible "sentinels",
 * one screen each. One IntersectionObserver watches a line across the middle of
 * the screen; whichever sentinel is on that line is the active step. That is
 * the only thing JavaScript does while you scroll: it sets a number, and CSS
 * transitions carry the bento to the new step (see bento.tsx). No scroll
 * listener, no requestAnimationFrame, nothing running at rest. The wheel is
 * never captured: the page scrolls natively, and `scroll-snap-type: y
 * proximity` settles it on a step when you stop near one.
 *
 * Without JavaScript the stage is hidden (html.js is set before first paint in
 * layout.tsx) and the same bento is printed once per step, stacked.
 */

// Legal pages are plain links: this Next version's static export writes a nested
// route's prefetch file under a different name than its router asks for, so a
// <Link> to them logs two 404s (the homepage's closing.tsx does the same).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ArrowV({ up }: { up: boolean }) {
  return (
    <svg className={s.nextIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden focusable="false">
      <path d={up ? "M8 14V2M3 7l5-5 5 5" : "M8 2v12M3 9l5 5 5-5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Portfolio() {
  const [active, setActive] = useState(0);
  // The furthest step whose pictures may load: the active one plus the next.
  const [reach, setReach] = useState(1);
  const sentinels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setActive(index);
          setReach((r) => Math.max(r, Math.min(index + 1, STEPS.length - 1)));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const el of sentinels.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((index: number) => {
    const target = sentinels.current[index];
    if (!target) return;
    // Warm the target's pictures before the scroll lands on it.
    setReach((r) => Math.max(r, index));
    target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  const last = active === STEPS.length - 1;

  const next = (
    <button type="button" className={s.next} onClick={() => goTo(last ? 0 : active + 1)}>
      <span className={s.nextLabel}>{last ? "Start again" : "Next site"}</span>
      <ArrowV up={last} />
    </button>
  );

  const dots = (
    <div className={s.dots} role="group" aria-label="Jump to a site">
      {STEPS.map((step, i) => (
        <button
          key={step.id}
          type="button"
          className={s.dot}
          aria-label={step.shot ? `Show ${step.title}` : "Show what we can make for you"}
          aria-current={i === active ? "step" : undefined}
          onClick={() => goTo(i)}
        >
          <span />
        </button>
      ))}
    </div>
  );

  return (
    <main className={s.page}>
      {/* With JavaScript: one sticky stage that morphs from step to step. */}
      <div className={s.track} style={{ "--steps": STEPS.length } as CSSProperties}>
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            ref={(el) => {
              sentinels.current[i] = el;
            }}
            data-index={i}
            className={s.sentinel}
            style={{ "--i": i } as CSSProperties}
            aria-hidden
          />
        ))}
        <div className={s.sticky}>
          <Bento
            steps={STEPS}
            active={active}
            loaded={(i) => i <= reach}
            priority
            headingLevel="h1"
            next={next}
            dots={dots}
            className={s.stage}
          />
        </div>
      </div>

      {/* Without JavaScript: every step, stacked. */}
      <div className={s.static}>
        {STEPS.map((step, i) => {
          const following = STEPS[i + 1];
          return (
            <Bento
              key={step.id}
              id={`site-${step.id}`}
              steps={[step]}
              active={0}
              loaded={() => true}
              headingLevel={i === 0 ? "h1" : "p"}
              next={
                <a className={s.next} href={following ? `#site-${following.id}` : `#site-${STEPS[0].id}`}>
                  <span className={s.nextLabel}>{following ? "Next site" : "Start again"}</span>
                  <ArrowV up={!following} />
                </a>
              }
              className={s.staticBento}
            />
          );
        })}
      </div>

      <footer className={s.footer}>
        <p className={s.footBox}>
          © HVNF Studios — do not redistribute. The four brands are made up; the sites are real and you can use them.
        </p>
        <a href={`${BASE}/legal/terms/`} className={s.footLink}>
          Terms
        </a>
        <a href={`${BASE}/legal/privacy/`} className={s.footLink}>
          Privacy
        </a>
        <Link href="/" className={s.footLink}>
          Homepage
        </Link>
      </footer>
    </main>
  );
}
