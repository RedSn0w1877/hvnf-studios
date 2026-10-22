"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { STUDIO_EMAIL } from "@/lib/studio";
import { Beam, RegisteredHeading } from "./kit";
import { CubeMark, CubeSlot } from "./cube-mark";

// Without a live Stage the slot's own MarkConverge lands its brace at ~1.5s;
// the Status cell reads "Built" just after it.
const SETTLE_MS = 1600;
// The live cube clicks shut when the footer's top reaches 30% of the viewport
// (the end of T6 in cube-director). Used only as a guard, see useClosingBuilt.
const LOCK_LINE = 0.3;
// "Page ready in" is only shown for a load worth naming: LCP of 2.5s or less,
// the line web.dev calls good. Kept in tenths of a second, rounded up.
const GOOD_TENTHS = 25;

const CTA_ENTRY = { "--ld": "140ms" } as CSSProperties;
const LINK = "underline decoration-rule-strong underline-offset-[5px] hover:decoration-ember";

/**
 * The last thing on the page: the cube clicks shut over one ask and one
 * alternative, then a drawing's title block carries the small print.
 *
 * min-h 100svh is load-bearing: it guarantees the page scrolls far enough for
 * the closing lock (T6) to finish.
 */
export function Closing({ onStart }: { onStart: () => void }) {
  return (
    <footer id="closing" className="relative flex min-h-[100svh] flex-col border-t border-rule">
      <div className="shell flex flex-1 flex-col pb-8 pt-20 md:pt-28">
        {/*
          A centred column until 1440 (90rem), where there is room to set slot and
          ask side by side. The breakpoint is written in rem on purpose: Tailwind
          cannot order a px breakpoint against its rem ones, and would emit it
          before md:, letting md: win at every width.
        */}
        <div className="flex flex-1 flex-col items-center justify-center min-[90rem]:grid min-[90rem]:grid-cols-12 min-[90rem]:gap-x-8">
          <CubeSlot
            name="closing"
            play="view"
            className="mx-auto w-[min(64vw,40vh,420px)] min-[90rem]:col-span-5 min-[90rem]:w-[min(100%,56vh,600px)]"
          />

          <div className="mt-12 w-full text-center min-[90rem]:col-span-7 min-[90rem]:mt-0 min-[90rem]:text-left">
            {/* The space between the two lines keeps the accessible name a sentence apart. */}
            <RegisteredHeading
              trigger="view"
              className="t-h2 mx-auto max-w-[18ch] font-display font-semibold text-bone min-[90rem]:mx-0"
            >
              <span className="block text-ash">Good work deserves</span>{" "}
              <span className="block">a good website.</span>
            </RegisteredHeading>

            <div
              data-lock="a"
              style={CTA_ENTRY}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 min-[90rem]:justify-start"
            >
              <Beam onClick={onStart}>Start a project</Beam>
              <Beam href={`mailto:${STUDIO_EMAIL}`} variant="link">
                {STUDIO_EMAIL}
              </Beam>
            </div>
          </div>
        </div>

        <TitleBlock />

        <div className="mt-10 flex items-center gap-2.5 text-[13px] text-muted">
          <CubeMark size={20} className="shrink-0" />
          <span>© 2026 HVNF Studios</span>
        </div>
      </div>
    </footer>
  );
}

/*
  The title block, ruled like the corner of a drawing: rule-strong outside, rule
  inside. Each cell draws its own right and bottom rule 1px past its track, so
  rules never double up between cells, and the overflow clip trims the ones that
  would land on the outer frame. The spans keep every row full whether or not
  the "Page ready in" cell earns its place:

    < 768   2 cols  Contact spans both (the address needs the width); dense flow
                    lifts Status up beside Studio, so no hole is left.
    768+    3 cols  Studio | Contact ×2, then Status, Page ready, Small print.
    1440+   5 cols  One row.

  Without the page-ready cell the small print takes the gap with col-span-2.
*/
function TitleBlock() {
  const tenths = usePageReadyTenths();
  const seconds = tenths !== null && tenths <= GOOD_TENTHS ? (tenths / 10).toFixed(1) : null;

  return (
    <dl
      data-lock="c"
      className="mt-16 grid grid-flow-row-dense grid-cols-2 overflow-hidden border border-rule-strong md:mt-20 md:grid-flow-row md:grid-cols-3 min-[90rem]:grid-cols-5"
    >
      <Cell label="Studio">HVNF Studios</Cell>
      <Cell label="Contact" className="col-span-2 min-[90rem]:col-span-1">
        {/* Inline padding widens the tap target without moving the line. */}
        <a href={`mailto:${STUDIO_EMAIL}`} className={`py-2.5 [overflow-wrap:anywhere] ${LINK}`}>
          {STUDIO_EMAIL}
        </a>
      </Cell>
      <Cell label="Status">
        <Status />
      </Cell>
      {seconds ? <Cell label="Page ready in">{seconds} seconds on your connection</Cell> : null}
      {/*
        44px links on a 24px line: the 10px they overhang each side comes out of the
        cell's padding (-mt-1 is the usual 6px gap less 10), so the row keeps the
        same baseline as its neighbours.
      */}
      <Cell
        label="Small print"
        className={seconds ? undefined : "col-span-2"}
        valueClassName="-mb-2.5 -mt-1 flex flex-wrap gap-x-6"
      >
        <Link href="/legal/terms" className={`inline-flex min-h-11 items-center ${LINK}`}>
          Terms
        </Link>
        <Link href="/legal/privacy" className={`inline-flex min-h-11 items-center ${LINK}`}>
          Privacy
        </Link>
      </Cell>
    </dl>
  );
}

function Cell({
  label,
  className,
  valueClassName,
  children,
}: {
  label: string;
  className?: string;
  /** Replaces the value's default spacing (mt-1.5) rather than adding to it. */
  valueClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`-mb-px -mr-px border-b border-r border-rule px-4 py-4 md:px-5 md:py-5 ${className ?? ""}`}>
      <dt className="text-[13px] font-medium leading-5 text-muted">{label}</dt>
      <dd className={`text-[16px] font-medium leading-6 text-bone ${valueClassName ?? "mt-1.5"}`}>{children}</dd>
    </div>
  );
}

/*
  "Drawing" until the cube is built, then "Built": two words in a one-line mask,
  each sliding 100% on Y over 400ms. The first paint is already right for the
  visitors JS will never reach: reduced motion and no-JS (html without .js) are
  pinned to "Built" in CSS, before hydration.
*/
function Status() {
  const built = useClosingBuilt();
  const slide = "block transition-transform duration-[400ms] ease-settle";
  return (
    <span className="relative block overflow-hidden">
      <span
        aria-hidden={built || undefined}
        className={`${slide} ${built ? "-translate-y-full" : "translate-y-0"} motion-reduce:-translate-y-full [html:not(.js)_&]:-translate-y-full`}
      >
        Drawing
      </span>
      <span
        aria-hidden={built ? undefined : true}
        className={`absolute inset-x-0 top-0 ${slide} ${built ? "translate-y-0" : "translate-y-full"} motion-reduce:translate-y-0 [html:not(.js)_&]:translate-y-0`}
      >
        Built
      </span>
    </span>
  );
}

/**
 * True once the closing cube is built.
 *
 *  - Live Stage: the director dispatches `hvnf:cube-lock` {slot:"closing"} as
 *    the cube clicks shut at the end of T6, and the word flips with the flash.
 *  - Lite, a failed context, or a Stage still loading: 1.6s after the slot is
 *    marked in, when its MarkConverge has landed.
 *  - Reduced motion (or no IntersectionObserver, so no data-in ever): at once.
 *
 * One guard: if the Stage is live when the 1.6s runs out but the footer is
 * already past the lock line, the Stage woke up beyond T6 (a reload that
 * restored the scroll) and will never see the crossing, so flip anyway. That is
 * one rect read, once.
 */
function useClosingBuilt() {
  const [built, setBuilt] = useState(false);

  useEffect(() => {
    const slot = document.querySelector<HTMLElement>('[data-cube-slot="closing"]');
    if (!slot || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBuilt(true);
      return;
    }

    const root = document.documentElement;
    let timer = 0;

    const onLock = (event: Event) => {
      if ((event as CustomEvent<{ slot?: string }>).detail?.slot === "closing") setBuilt(true);
    };

    const settle = () => {
      const live = root.dataset.stage === "live" && !root.hasAttribute("data-lite");
      if (!live) return setBuilt(true);
      const top = slot.closest("footer")?.getBoundingClientRect().top ?? 0;
      if (top <= window.innerHeight * LOCK_LINE + 1) setBuilt(true);
    };

    // lock.ts marks the slot in exactly once. Child effects run before
    // page.tsx's, so on mount it has not started yet: watch, don't read once.
    const arrival = new MutationObserver(() => {
      if (!slot.hasAttribute("data-in")) return;
      arrival.disconnect();
      timer = window.setTimeout(settle, SETTLE_MS);
    });

    window.addEventListener("hvnf:cube-lock", onLock);
    if (slot.hasAttribute("data-in")) timer = window.setTimeout(settle, SETTLE_MS);
    else arrival.observe(slot, { attributes: true, attributeFilter: ["data-in"] });

    return () => {
      window.removeEventListener("hvnf:cube-lock", onLock);
      arrival.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return built;
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
