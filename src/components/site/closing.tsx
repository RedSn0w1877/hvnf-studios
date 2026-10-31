"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { STUDIO_EMAIL } from "@/lib/studio";
import { Beam, RegisteredHeading } from "./kit";
import { CubeMark, CubeSlot } from "./cube-mark";

// The speed line is only shown for a load worth naming: LCP of 2.5s or less,
// the line web.dev calls good. Kept in tenths of a second, rounded up.
const GOOD_TENTHS = 25;

const CTA_ENTRY = { "--ld": "140ms" } as CSSProperties;
const LINK = "underline decoration-rule-strong underline-offset-[5px] hover:decoration-ember";
/*
  44px tap targets on a 20px line. The padding widens each link's box and the
  matching negative margin takes it back out, so the words and the dots between
  them stay evenly spaced while a thumb still gets a 44px target.
*/
const SMALL_LINK = `-mx-2 inline-flex min-h-11 items-center px-2 ${LINK}`;

/**
 * The last thing on the page, and its second loud moment: the cube clicks shut
 * next to one sentence, one ask and the plain way to reach us, then a single
 * line of small print.
 *
 * min-h 100svh is load-bearing: it guarantees the page scrolls far enough for
 * the closing lock (T6) to finish.
 */
export function Closing({ onStart }: { onStart: () => void }) {
  const tenths = usePageReadyTenths();
  const seconds = tenths !== null && tenths <= GOOD_TENTHS ? (tenths / 10).toFixed(1) : null;

  return (
    <footer id="closing" className="relative flex min-h-[100svh] flex-col border-t border-rule">
      <div className="shell flex flex-1 flex-col pb-8 pt-20 md:pt-28">
        {/*
          Stacked and left-aligned (like the hero) until 1024, then the slot and
          the words side by side, the cube on the left.
        */}
        <div className="flex flex-1 flex-col justify-center lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8">
          <CubeSlot
            name="closing"
            play="view"
            className="mx-auto w-[min(64vw,40vh,420px)] lg:col-span-5 lg:w-[min(100%,56vh,600px)]"
          />

          {/* A size container, so the heading below can be sized from this column. */}
          <div className="@container mt-12 lg:col-span-7 lg:mt-0">
            {/*
              One colour, and bigger than every section heading: two lines at
              every width. "Good work deserves" is 10.36em wide in this face, and
              9.2cqi keeps it ~5% inside the column. From 1024 the size comes
              from the column alone, not the viewport: between 1456 and 1919 the
              shell stops growing while vw does not, and a vw size wrapped it to
              three lines there. Below 1024 it is the vw size, cut down to the
              column on phones, where 2.4rem stranded "deserves" on a line of
              its own. The space between the two lines keeps the accessible name
              one sentence.
            */}
            <RegisteredHeading
              trigger="view"
              className="max-w-[18ch] font-display text-[length:min(clamp(2.4rem,1rem_+_3.4vw,4.4rem),9.2cqi)] font-semibold leading-[1] tracking-[-0.03em] text-bone lg:text-[length:clamp(2.4rem,9.2cqi,4.4rem)]"
            >
              <span className="block">Good work deserves</span>{" "}
              <span className="block">a good website.</span>
            </RegisteredHeading>

            <div data-lock="a" style={CTA_ENTRY} className="mt-10">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
                <Beam onClick={onStart}>Ask for a preview</Beam>
                {/* One element, so "or email" and the address wrap together. */}
                <p className="text-[15px] text-muted">
                  or email{" "}
                  <Beam href={`mailto:${STUDIO_EMAIL}`} variant="link">
                    {STUDIO_EMAIL}
                  </Beam>
                </p>
              </div>

              <p className="mt-8 max-w-md text-[15px] leading-relaxed text-ash">
                We design and build every site ourselves. When you email, a person writes back.
              </p>
              {seconds ? (
                <p className="mt-3 text-[13px] text-muted">This page showed up in {seconds} seconds on your connection.</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* The {" "}s don't change the flex layout; they keep the text (and what a screen reader says) word-spaced. */}
        <p className="mt-16 flex flex-wrap items-center gap-x-2 text-[13px] leading-5 text-muted md:mt-20">
          <CubeMark size={20} className="mr-0.5 shrink-0" />
          <span>© 2026 HVNF Studios</span>{" "}
          <span aria-hidden>·</span>{" "}
          <Link href="/legal/terms" className={SMALL_LINK}>
            Terms
          </Link>{" "}
          <span aria-hidden>·</span>{" "}
          <Link href="/legal/privacy" className={SMALL_LINK}>
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}

/**
 * This visitor's real Largest Contentful Paint, in tenths of a second rounded
 * up (never down), or null when the browser cannot say. Read from the buffered
 * entries, so it includes the paint that already happened before hydration.
 * The browser stops issuing candidates at the first scroll or tap, and nobody
 * reaches the footer without one, so the figure is final by the time it is seen.
 */
function usePageReadyTenths() {
  const [tenths, setTenths] = useState<number | null>(null);

  useEffect(() => {
    if (
      typeof PerformanceObserver === "undefined" ||
      !PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")
    ) {
      return;
    }

    // A prerendered page is timed from when it was shown, not when it was fetched.
    const navigation = performance.getEntriesByType("navigation")[0] as
      | (PerformanceNavigationTiming & { activationStart?: number })
      | undefined;
    const shown = navigation?.activationStart ?? 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const latest = entries[entries.length - 1];
      if (latest) setTenths(Math.ceil(Math.max(0, latest.startTime - shown) / 100));
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    return () => observer.disconnect();
  }, []);

  return tenths;
}
