"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useDeviceProfile, useMedia } from "@/lib/perf";
import { CubeMark, CubeSlot } from "./cube-mark";
import { RegisteredHeading } from "./kit";

// Each step is one state of the cube being made: drawn, marked up, built, locked.
// The label names that state in the cube's own colour (draft blue, the ember
// redline, line white, bone), so the words match what the cube beside them is
// doing. This is the one place ember means redline rather than "press here".
const STEPS = [
  {
    label: "Draft",
    tone: "text-draft",
    title: "We build first, then talk",
    body:
      "You get a working preview of your new site before you pay anything, already filled in with your photos, reviews and services. Open it on your phone and press the call button.",
    state: "draft",
  },
  {
    label: "Your changes",
    tone: "text-ember",
    title: "You tell us what to change",
    body:
      "We’ll get a few things wrong, like an old photo or a service you don’t offer anymore. Send us a list and we’ll work through it with you until it sounds like your business.",
    state: "redline",
  },
  {
    label: "Built",
    tone: "text-line",
    title: "We finish the job",
    body:
      "Once we’ve agreed on a written quote, you pay half and we finish the pages with your own words and photos. We check every page on a phone, and messages and bookings come straight to you.",
    state: "build",
  },
  {
    label: "Yours",
    tone: "text-bone",
    title: "It goes live in your name",
    body:
      "You pay the other half right before the new site goes up at your web address. The address and the code are yours. While you’re on a care plan we host it for you, and if you ever leave, we hand it all over.",
    state: "lock",
  },
] as const;

/** The state label above each step's title: 13px body face, never mono or caps. */
const LABEL = "block text-[13px] font-medium leading-5";

/*
  Diagram rows only (the story rows carry no drawing). The redline step's ember
  corrections arrive a beat after the drawing: hidden
  until the row's data-in, then faded by CubeMark's own 400ms opacity transition
  (the delay is !important only because that transition shorthand is unlayered).
  Gated on lock.ts, so with no JS, or under reduced motion where every row is in
  from the start, the marks are simply there. Only the redline glyph has a
  .cm-redline, so the other rows ignore this.
*/
const REDLINE_LATE = "[html[data-lock-ready]_&:not([data-in])_.cm-redline]:opacity-0 [&_.cm-redline]:delay-[360ms]!";

/**
 * How a job runs, told as the cube being made: drafted, redlined, built,
 * locked.
 *
 * On a wide, capable screen the WebGL cube parks in a CSS-sticky slot on the
 * left (no pin, no spacer) and the director walks it through the four states as
 * the steps pass on the right. The heading sits at the top of that right-hand
 * column, so the cube never passes under it. This file runs no animation of its
 * own: it lays out the slot and the steps, and one IntersectionObserver with a
 * thin band across the middle of the screen marks the current step
 * data-active. CSS dims the rest.
 *
 * Below 1024px, on lite devices and under reduced motion there is no cube to
 * follow, so the heading stacks above the rows, each step carries its own 96px
 * drawing of its state, and the four rows read as one diagram.
 *
 * The heading block and the list are the same elements in both layouts (only
 * their classes change), so the swap after hydration never remounts them and
 * never replays an entrance that has already played.
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
    <section id="method" className="relative py-28 md:pb-36 md:pt-44">
      {/*
        Story: one 12-column grid. The slot's column spans both rows (heading,
        then steps), so it stretches to their full height and plain CSS sticky
        holds it for the whole list. The fallback SVG inside only shows if the
        Stage fails; normally the WebGL cube is drawn over this box.
      */}
      <div className={story ? "shell grid grid-cols-12 gap-x-8" : "shell"}>
        {story ? (
          <div className="col-span-5 row-span-2 row-start-1">
            <CubeSlot name="method" className="sticky top-[12vh] h-[76vh] !aspect-auto" />
          </div>
        ) : null}

        <div className={story ? "col-span-6 col-start-7 row-start-1" : undefined}>
          <RegisteredHeading as="h2" trigger="view" className="t-h2 font-display font-semibold text-bone">
            How it works
          </RegisteredHeading>
          <p
            data-lock="c"
            style={{ "--ld": "140ms" } as CSSProperties}
            className="mt-4 max-w-[34rem] text-balance text-[16px] leading-relaxed text-ash"
          >
            {/* The no-break space keeps "walk away" whole, so a two-line wrap breaks at the comma. */}
            If you don’t like the preview, walk&nbsp;away. You won’t owe us anything.
          </p>
        </div>

        <ol ref={list} className={story ? "col-span-6 col-start-7 row-start-2" : "mt-16 border-t border-rule"}>
          {STEPS.map((step) =>
            story ? (
              // Inactive steps dim to .72, not the spec's .4: enough to keep
              // every line of an inactive step above 4.5:1 even on the lightest
              // (top) end of the sky. The draft-blue label is the dimmest of
              // them (4.7:1 on ink, 4.6:1 at the top; ash body 5.1:1, the ember
              // label 5.3:1). At .4 a step still on screen fell to 2.3:1 while
              // its neighbour took over the band. No drawing here: the WebGL
              // cube beside the step already shows it.
              <li
                key={step.state}
                data-step
                data-lock="c"
                className="flex min-h-[56vh] flex-col justify-center py-10 opacity-[.72] transition-opacity duration-400 ease-settle data-active:opacity-100"
              >
                <span className={`${LABEL} ${step.tone}`}>{step.label}</span>
                <h3 className="t-h3 mt-3 font-display font-semibold text-bone">{step.title}</h3>
                <p className="mt-4 max-w-xl text-base leading-[1.65] text-ash">{step.body}</p>
              </li>
            ) : (
              // The diagram: drawing on the left, words on the right, one ruled row a step.
              <li
                key={step.state}
                data-step
                data-lock="c"
                className={`grid gap-x-10 gap-y-5 border-b border-rule py-10 sm:grid-cols-[96px_minmax(0,1fr)] lg:grid-cols-12 lg:gap-x-8 ${REDLINE_LATE}`}
              >
                <CubeMark size={96} state={step.state} className="sm:row-span-2 lg:col-span-2 lg:row-span-1" />
                <div className="lg:col-span-4">
                  <span className={`${LABEL} ${step.tone}`}>{step.label}</span>
                  <h3 className="t-h3 mt-2 font-display font-semibold text-bone">{step.title}</h3>
                </div>
                <p className="max-w-2xl text-base leading-[1.65] text-ash lg:col-span-6 lg:col-start-7">{step.body}</p>
              </li>
            ),
          )}
        </ol>
      </div>
    </section>
  );
}
