"use client";

import { useRef, type CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { CubeMark, CubeSlot } from "./cube-mark";
import { Beam, IsoRhombus, RegisteredHeading } from "./kit";

// The reader is a plumber or a dentist, not a developer. A framework name is the
// wrong first fact to hand them; what the site does for them is the right one.
// The terms stay in the markup for screen readers; on screen it is one plain line.
const MARKS = [
  { k: "Built for", v: "Phones first" },
  { k: "Shipped in", v: "Live in days, not months" },
  { k: "Ownership", v: "Yours, outright" },
] as const;

/** Entrance delay for the .load-* keyframes (globals.css). */
const ld = (ms: number) => ({ "--ld": `${ms}ms` }) as CSSProperties;

/**
 * Folio zero. Plain words on the left say what this is; the cube on the right
 * carries the brand. The slot is only a measured box: the WebGL Stage draws the
 * cube over it, and lite devices get the SVG fallback inside it.
 *
 * Everything that moves here is CSS from first paint (.load-* along the cube's
 * axes, the h1's registration ghost), so nothing waits on hydration, fonts or
 * WebGL. The real h1 is server-rendered, static and fully opaque: it is the LCP.
 */
export function Hero({ onStart }: { onStart: () => void }) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);

  // The copy drifts down and dims as the hero leaves, handing the page to the
  // work instead of scrolling away as a flat sheet. Two scrubbed tweens on one
  // wrapper, transform and opacity only, on gsap's clock (Lenis already smooths
  // the scroll, so scrub is direct). The slot sits outside the wrapper on
  // purpose: the Stage measures it and must never find it mid-drift.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const trigger = section.current;
        const target = copy.current;
        if (!trigger || !target) return;
        gsap.to(target, {
          yPercent: 16,
          ease: "none",
          scrollTrigger: { trigger, start: "top top", end: "bottom top", scrub: true },
        });
        // The drag caption dims with the copy (opacity only, so nothing beside
        // the measured slot moves): once the cube has flown, there is nothing
        // left to drag.
        gsap.to([target, caption.current].filter(Boolean), {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger, start: "top top", end: "72% top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="top" className="relative flex min-h-[100svh] items-center overflow-clip pb-24 pt-28">
      {/*
        From 1920 up the 12-column split would cap the cube at 592px, so two
        explicit tracks take over: the slot gets 672px and the copy keeps 768,
        just over the h1's 760px measure at its clamp max, so it never rewraps.
      */}
      <div className="shell grid grid-cols-1 items-center gap-y-12 md:grid-cols-12 md:gap-x-8 lg:gap-x-12 min-[120rem]:grid-cols-[minmax(0,1fr)_672px]">
        <div ref={copy} className="md:col-span-7 min-[120rem]:col-span-1">
          <p className="load-c flex items-center gap-2.5 text-sm font-medium text-ash">
            <CubeMark size={22} className="shrink-0" />
            HVNF Studios · websites for local businesses
          </p>

          {/*
            The LCP: real text, server-rendered, never moved or faded (only its
            aria-hidden ghost converges). Measured with the real face at 4 lines
            from 360 to 2560 wide, inside the ≤6 / ≤5 budget, so .t-h1's 4.6rem
            clamp max stands.
          */}
          <RegisteredHeading
            as="h1"
            trigger="load"
            className="t-h1 font-display font-semibold text-bone"
            wrapperClassName="mt-7"
          >
            Websites that load fast<span className="text-ash"> and turn visitors into</span>
            <span className="text-ember"> booked work.</span>
          </RegisteredHeading>

          <p className="load-c t-lead mt-8 max-w-xl" style={ld(160)}>
            We build fast websites for local businesses — trades, clinics, salons and shops. Yours will work on a
            phone, load quickly, and make it easy for people to call or book.
          </p>

          <div className="load-a mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={ld(240)}>
            <Beam onClick={onStart}>Start a project</Beam>
            <Beam href="#work" variant="link">
              See the work
              <ArrowDown size={14} aria-hidden />
            </Beam>
          </div>

          {/*
            The rhombus lives inside the dd: a dl's row may only hold dt and dd.
            Below md the run can wrap, so the first mark gets one too and a
            wrapped line reads as a bulleted list, not a stray separator.
          */}
          <dl
            className="load-c mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-ash"
            style={ld(320)}
          >
            {MARKS.map((mark, i) => (
              <div key={mark.k}>
                <dt className="sr-only">{mark.k}</dt>
                <dd className="flex items-center gap-3">
                  <IsoRhombus className={i > 0 ? undefined : "md:hidden"} />
                  {mark.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-[min(78vw,360px)] md:col-span-5 md:mx-0 md:w-full md:max-w-[620px] md:justify-self-end min-[120rem]:col-span-1 min-[120rem]:max-w-none">
          <CubeSlot name="hero" play="load" className="w-full" />
          {/*
            Only where the drag exists: a fine pointer, a desktop column, and a
            live Stage (it fades in when the Stage reports its first frame, and
            never shows on lite or a failed context). Absolute, so it neither
            shifts the slot off-centre nor moves anything when it appears. The
            plain wrapper is what the scroll fade dims, so its inline opacity
            never fights the class-driven reveal on the <p>.
          */}
          <div ref={caption}>
            <p
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-full mt-5 hidden text-center text-[13px] text-muted opacity-0 transition-opacity duration-500 ease-settle md:pointer-fine:block [html[data-lite]_&]:hidden [html[data-stage=live]_&]:opacity-100"
            >
              Drag it. It only lines up from one angle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
