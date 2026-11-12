"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Menu, X } from "lucide-react";
import { SmallMark } from "./cube-art";
import { Button } from "./kit";

const LINKS = [
  { href: "#work", label: "Examples" },
  { href: "#method", label: "How it works" },
  { href: "#care", label: "What you get" },
] as const;

/**
 * The header, printed on the ember field at the top of the page: the mark and
 * name, the three section links, and the ink "Ask for a preview" button.
 *
 * At the top it is part of the poster: absolutely placed over the top of the
 * hero (which pads itself by --nav-h). Once the hero has scrolled away (all but
 * the strip the bar itself would cover) it becomes the return bar: the same
 * header, fixed, an ember strip with a 3px ink rule under it, dropped in from
 * above (globals.css, .nav-bar[data-stuck]). So the way to ask for a preview,
 * and the way back to each section, stays in reach for the four screens
 * between the hero and the closing call. One IntersectionObserver on the hero
 * decides it; it fires only when the hero's bottom edge crosses that line, so
 * nothing runs at rest. A second one on the closing call sends the bar up and
 * out while that section is on screen (data-away, globals.css), so its button
 * never doubles the closing's own; a third marks the section link you are
 * reading (aria-current). Each fires only when an edge crosses its line.
 *
 * The header paints its own ember even at the top, where it lies over the
 * hero's ember: its ink focus ring then sits on a ground of its own, in the
 * page's structure as well as on screen (the body behind it is ink).
 *
 *  - 1024 and up: links in a row, button on the right.
 *  - 640 to 1023: the links fold into the menu; the button stays.
 *  - under 640: the menu button only at the top (the hero's own button is
 *    right there). In the bar the button comes back beside it, as the one
 *    action a phone needs mid-page, and the wordmark shortens to fit.
 *    The sheet the menu opens covers the screen in ember and carries the
 *    links and the button, full width under the thumb.
 */
export function Nav({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [away, setAway] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  // The bar is on while the hero is above the bar's line (no more than the
  // bar's own height of it left on screen). That line matters: a jump to
  // "Examples" stops 64px below the top (scroll-padding-top in globals.css),
  // which leaves exactly that strip of hero showing, and the bar must cover it.
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    // --bar-h at its largest, plus 2px: an edge that just touches the line
    // still counts as intersecting, and a jump lands the hero's bottom exactly on it.
    const LINE = 66;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStuck(!entry.isIntersecting && entry.boundingClientRect.bottom <= LINE);
      },
      { rootMargin: `-${LINE}px 0px 0px 0px` },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Away while the closing call is on screen: from when its top clears the
  // bottom 10% of the screen (its 8px band peeking in does not count).
  useEffect(() => {
    const closing = document.getElementById("closing");
    if (!closing || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setAway(entry.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    });
    observer.observe(closing);
    return () => observer.disconnect();
  }, []);

  // The section under a line across the middle of the screen is the current one.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = LINKS.map((link) => document.getElementById(link.href.slice(1))).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          setCurrent((was) => (entry.isIntersecting ? id : was === id ? null : was));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // While the sheet is open: Escape closes it, Tab stays inside the header, the
  // page behind never scrolls, and widening to the desktop layout closes it.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus({ preventScroll: true });
      }
      if (e.key !== "Tab") return;
      const controls = Array.from(
        header.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      media.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header
      ref={header}
      // Ink text and an ink focus ring: this always sits on ember.
      className={`nav-bar inset-x-0 top-0 z-50 text-ink [--focus:var(--color-ink)] ${
        open
          ? "fixed bottom-0 flex flex-col overflow-y-auto bg-ember"
          : stuck
            ? "fixed border-b-[3px] border-ink bg-ember"
            : "absolute bg-ember"
      }`}
      data-stuck={stuck ? "" : undefined}
      data-away={stuck && away && !open ? "" : undefined}
    >
      <div
        className={`flex shrink-0 gap-11 px-g max-sm:gap-3 ${
          stuck ? "h-[var(--bar-h)] items-center" : "h-[var(--nav-h)] items-end"
        }`}
      >
        <a href="#top" className="flex min-h-[46px] items-center gap-3" aria-label="HVNF Studios, back to top">
          <SmallMark className="w-[34px] max-sm:w-[30px]" />
          {/* In the phone bar the button needs the room: "Studios" goes, and "HVNF" too under 375px. */}
          <b
            className={`font-display text-[24px] font-extrabold leading-none tracking-[-0.03em] max-sm:text-[22px] ${
              stuck && !open ? "max-[374px]:hidden" : ""
            }`}
          >
            HVNF
          </b>
          <span className={`text-[16px] font-medium ${stuck && !open ? "max-sm:hidden" : ""}`}>Studios</span>
        </a>

        <nav aria-label="Sections" className="max-lg:hidden">
          {/* role=list: Safari drops list semantics from a list with list-style none. */}
          <ul role="list" className="flex gap-[30px] text-[16px] font-semibold">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={current === link.href.slice(1) ? "true" : undefined}
                  className="inline-flex min-h-[46px] items-center underline-offset-[6px] hover:underline hover:decoration-2 aria-[current=true]:underline aria-[current=true]:decoration-2"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Button onClick={onStart} size="sm" className={`ml-auto ${stuck && !open ? "" : "max-sm:hidden"}`}>
          Ask for a preview
        </Button>

        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          className={`btn size-[46px] shrink-0 !min-h-0 !p-0 lg:hidden ${stuck && !open ? "" : "max-sm:ml-auto"}`}
        >
          {open ? <X size={22} strokeWidth={2.5} aria-hidden /> : <Menu size={22} strokeWidth={2.5} aria-hidden />}
        </button>
      </div>

      {open ? (
        <div id="mobile-sheet" className="ld-fade flex flex-1 flex-col px-g pb-8 pt-6 lg:hidden" style={{ "--rv-t": "200ms" } as CSSProperties}>
          <nav aria-label="Sections">
            <ul role="list" className="border-t-[3px] border-ink">
              {LINKS.map((link) => (
                <li key={link.href} className="border-b-[3px] border-ink">
                  <a
                    href={link.href}
                    aria-current={current === link.href.slice(1) ? "true" : undefined}
                    onClick={() => setOpen(false)}
                    className="t-display flex min-h-[72px] items-center py-3 text-[40px] leading-none"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button
            block
            className="mt-8 sm:hidden"
            onClick={() => {
              // This button goes away with the sheet, so focus moves to the
              // menu button first: the drawer remembers that as its opener
              // and hands focus back to it on close, not to <body>.
              menuButton.current?.focus({ preventScroll: true });
              setOpen(false);
              onStart();
            }}
          >
            Ask for a preview
          </Button>
        </div>
      ) : null}
    </header>
  );
}
