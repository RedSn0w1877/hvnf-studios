"use client";

import { useRef, type CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { CubeSlot } from "./cube-mark";
import { Beam, RegisteredHeading } from "./kit";

/** Entrance delay for the .load-* keyframes (globals.css). */
const ld = (ms: number) => ({ "--ld": `${ms}ms` }) as CSSProperties;

/**
 * Folio zero, in three parts: what this is and who it's for (the h1), who makes
 * it (the lead), and one thing to do (the button). The cube on the right
 * carries the brand. The slot is only a measured box: the WebGL Stage draws the
 * cube over it, and lite devices get the SVG fallback inside it.
 *
 * The lead and the buttons enter with CSS from first paint (.load-* along the
 * cube's axes), so nothing waits on hydration, fonts or WebGL. The h1 has no
 * entrance at all: server-rendered, static, one colour, fully opaque. It is the
 * LCP.
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
          {/*
            The LCP: real text in one colour, server-rendered, never moved or
            faded. Plain text on purpose (no spans), so size and the line breaks
            carry the emphasis and ember stays for the button. 4 lines from 360
            to 2560. Keep the lead under about 130 characters: on a 360 phone it
            is 3 lines (26,753 px² against this h1's 43,194), and a lead that
            out-areas the h1 takes LCP while it fades in.
          */}
          <RegisteredHeading as="h1" trigger="load" className="t-h1 font-display font-semibold text-bone">
            Fast websites for local businesses. Try yours before you pay.
          </RegisteredHeading>

          <p className="load-c t-lead mt-8 max-w-xl" style={ld(160)}>
            We’re a small studio. We build your new site from what’s already online about you, and you decide if
            it’s worth paying for.
          </p>

          <div className="load-a mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={ld(240)}>
            <Beam onClick={onStart}>Ask for a preview</Beam>
            <Beam href="#work" variant="link">
              See examples
              <ArrowDown size={14} aria-hidden />
            </Beam>
          </div>
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
              That’s our logo. Drag it and you’ll see it only lines up from one angle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
