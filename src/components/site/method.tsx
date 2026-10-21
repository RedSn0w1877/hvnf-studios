"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useDeviceProfile, useMedia } from "@/lib/perf";
import { CubeMark, CubeSlot } from "./cube-mark";
import { RegisteredHeading } from "./kit";

// Each step is one state of the cube being made: drawn, marked up, built, locked.
const STEPS = [
  {
    n: "01",
    title: "We build first, then talk",
    body:
      "You get a working preview of your own site before you pay anything. We build it from what is already public about your business. Open it on your phone and press the call button.",
    state: "draft",
  },
  {
    n: "02",
    title: "You mark it up",
    body:
      "Tell us what is wrong — the photos, the wording, the services you no longer offer. We work through your list together until the site sounds like your business.",
    state: "redline",
  },
  {
    n: "03",
    title: "We finish the build",
    body:
      "Half up front, then we finish the pages: your words, your photos, titles that help you show up in search, and forms and booking that reach you. Every page is checked on a phone.",
    state: "build",
  },
  {
    n: "04",
    title: "It goes live in your name",
    body:
      "You pay the rest before the domain moves. The domain, the hosting and the code all end up in your accounts, so the site is yours even if you stop working with us.",
    state: "lock",
  },
] as const;

/*
  The redline step's ember corrections arrive a beat after the drawing: hidden
  until the row's data-in, then faded by CubeMark's own 400ms opacity transition
  (the delay is !important only because that transition shorthand is unlayered).
  Gated on lock.ts, so with no JS, or under reduced motion where every row is in
  from the start, the marks are simply there. Only the redline glyph has a
  .cm-redline, so the other rows ignore this.
*/
const REDLINE_LATE = "[html[data-lock-ready]_&:not([data-in])_.cm-redline]:opacity-0 [&_.cm-redline]:delay-[360ms]!";

/**
 * How a build runs, told as the cube being made: drafted, redlined, built,
 * locked.
 *
 * On a wide, capable screen the WebGL cube parks in a CSS-sticky slot on the
 * left (no pin, no spacer) and the director walks it through the four states as
 * the steps pass on the right. This file runs no animation of its own: it lays
 * out the slot and the steps, and one IntersectionObserver with a thin band
 * across the middle of the screen marks the current step data-active. CSS
 * dims the rest.
 *
 * Below 1024px, on lite devices and under reduced motion there is no cube to
 * follow, so each step carries its own 96px drawing of its state and the four
 * rows read as one diagram.
 */
export function Method() {
  const { lite } = useDeviceProfile();
  // The server and the hydration pass always get the diagram rows (useMedia
  // answers false there, the device hook answers lite), and a wide, capable
  // screen swaps to the slot on the next commit. Method sits far below the
  // fold, so nobody sees it happen.
  const wide = useMedia("(min-width: 1024px)");
  // Reduced motion is already one of the lite rules. Asked here too, so the
  // slot never depends on that list staying the way it is.
  const reduce = useMedia("(prefers-reduced-motion: reduce)");
  const story = wide && !lite && !reduce;
  const list = useRef<HTMLOListElement>(null);

  // Exactly one current step, and it stays current until another reaches the
  // middle, so the column never dims entirely between steps or on the way out.
  // Attributes, not React state: crossing a step costs two DOM writes, no render.
  useEffect(() => {
    if (!story || !list.current) return;
    const items = Array.from(list.current.querySelectorAll("[data-step]"));
    let current = items[0];
    if (!current) return;
    current.setAttribute("data-active", "");
    const band = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.target === current) continue;
          current.removeAttribute("data-active");
          current = entry.target;
          current.setAttribute("data-active", "");
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.forEach((item) => band.observe(item));
    return () => {
      band.disconnect();
      items.forEach((item) => item.removeAttribute("data-active"));
    };
  }, [story]);

  return (
    <section id="method" className="relative py-28 md:py-36">
      <div className="shell">
        {/* The cube still in draft: nothing is built until you have seen it. */}
        <CubeMark size={28} state="draft" />

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <RegisteredHeading
            as="h2"
            trigger="view"
            className="t-h2 font-display font-semibold text-bone"
            wrapperClassName="lg:col-span-7"
          >
            You see the site before you pay for it.
          </RegisteredHeading>
          <p
            data-lock="c"
            style={{ "--ld": "140ms" } as CSSProperties}
            className="max-w-sm text-[15px] leading-relaxed text-ash lg:col-span-5 lg:justify-self-end"
          >
            Most studios sell you a plan and a timeline. We would rather hand you the site and let you judge it.
          </p>
        </div>

        {story ? (
          <div className="mt-12 grid grid-cols-12 gap-x-8">
            {/*
              The slot stretches to the full height of the steps (a grid item),
              so plain CSS sticky holds it for the whole list. The fallback SVG
              inside only shows if the Stage fails; normally the WebGL cube is
              drawn over this box.
            */}
            <div className="col-span-5">
              <CubeSlot name="method" className="sticky top-[12vh] h-[76vh] !aspect-auto" />
            </div>

            <ol ref={list} className="col-span-6 col-start-7">
              {STEPS.map((step) => (
                // Inactive steps dim to .67, not the spec's .4: the lowest value
                // that keeps the ash body text at 4.5:1 on the ink page behind
                // it (4.56:1; ember numerals 4.70:1). At .4 a step still on
                // screen fell to 2.3:1 while its neighbour took over the band.
                <li
                  key={step.n}
                  data-step
                  data-lock="c"
                  className={`flex min-h-[66vh] flex-col justify-center py-10 opacity-[.67] transition-opacity duration-400 ease-settle data-active:opacity-100 ${REDLINE_LATE}`}
                >
                  <span className="font-mono text-[12px] tracking-[0.06em] text-ember">{step.n}</span>
                  <h3 className="t-h3 mt-4 font-display font-semibold text-bone">{step.title}</h3>
                  <p className="mt-4 max-w-xl text-base leading-[1.65] text-ash">{step.body}</p>
                  <CubeMark size={56} state={step.state} className="mt-8" />
                </li>
              ))}
            </ol>
          </div>
        ) : (
          // The diagram: drawing on the left, words on the right, one ruled row a step.
          <ol className="mt-16 border-t border-rule">
            {STEPS.map((step) => (
              <li
                key={step.n}
                data-step
                data-lock="c"
                className={`grid gap-x-10 gap-y-5 border-b border-rule py-10 sm:grid-cols-[96px_minmax(0,1fr)] lg:grid-cols-12 lg:gap-x-8 ${REDLINE_LATE}`}
              >
                <CubeMark size={96} state={step.state} className="sm:row-span-2 lg:col-span-2 lg:row-span-1" />
                <div className="lg:col-span-4">
                  <span className="font-mono text-[12px] tracking-[0.06em] text-ember">{step.n}</span>
                  <h3 className="t-h3 mt-3 font-display font-semibold text-bone">{step.title}</h3>
                </div>
                <p className="max-w-2xl text-base leading-[1.65] text-ash lg:col-span-6 lg:col-start-7">{step.body}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
