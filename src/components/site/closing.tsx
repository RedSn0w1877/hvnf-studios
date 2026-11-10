"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { STUDIO_EMAIL } from "@/lib/studio";
import { ClosingCube, SmallMark } from "./cube-art";
import { Button, Section, TextLink } from "./kit";
import s from "./closing.module.css";

// The speed line is only shown for a load worth naming: LCP of 2.5s or less,
// the line web.dev calls good. Kept in tenths of a second, rounded up.
const GOOD_TENTHS = 25;

// 44px tap targets on a 20px line: the padding widens each link to a thumb-sized
// box and the matching negative margin takes it back out of the spacing.
const SMALL_LINK = "-mx-2 inline-flex min-h-11 min-w-11 items-center justify-center px-2 underline underline-offset-[5px]";

/**
 * Closing (ember) and the ink footer: the poster-size line, the button and the
 * email, a note, the measured speed line, and the solid cube cropped by the
 * corner. Locks shut on arrival: the two lines rise into place and the cube
 * comes up out of the bottom edge (CSS, via data-reveal; nothing at rest).
 *
 * usePageReadyTenths below, and the rule that the speed line only shows for a
 * good load, are exactly as they were.
 */
export function Closing({ onStart }: { onStart: () => void }) {
  const tenths = usePageReadyTenths();
  const seconds = tenths !== null && tenths <= GOOD_TENTHS ? (tenths / 10).toFixed(1) : null;

  return (
    <footer id="closing" data-reveal>
      <Section as="div" surface="ember" band className="relative overflow-hidden px-g pt-24 max-sm:pt-16 sm:min-h-[800px]">
        {/* Two lines at every width; the space between them keeps the accessible name one sentence. */}
        <h2 className="t-poster relative z-[2]">
          <span className="rv-up block">Good work deserves</span>{" "}
          <span className="rv-up block" style={{ "--d": "90ms" } as CSSProperties}>
            a good website.
          </span>
        </h2>

        <div className="relative z-[2] mt-11 max-w-[560px] pb-[120px] max-sm:mt-7 max-sm:pb-[72vw]">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <Button onClick={onStart} className="max-sm:flex-[1_1_100%]">
              Ask for a preview
            </Button>
            {/* One element, so "or email" and the address wrap together. */}
            <p className="text-[17px] font-medium">
              or email <TextLink href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</TextLink>
            </p>
          </div>

          <p className="mt-7 max-w-[25em] text-[18px] font-medium leading-[1.45]">
            We design and build every site ourselves. When you email, a person writes back.
          </p>
          {seconds ? (
            <p className="t-small mt-2.5">This page showed up in {seconds} seconds on your connection.</p>
          ) : null}
        </div>

        <div className={`${s.cube} rv-up`} style={{ "--d": "180ms", "--rv-t": "760ms" } as CSSProperties}>
          <ClosingCube />
        </div>
      </Section>

      {/* The {" "}s do not change the flex layout; they keep the text (and what a screen reader says) word-spaced. */}
      <p data-surface="ink" className="t-small relative z-[3] flex flex-wrap items-center gap-x-3.5 gap-y-1.5 px-g py-[18px]">
        <SmallMark className="mr-0.5 w-6 shrink-0" />
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
