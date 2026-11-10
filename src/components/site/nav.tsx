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
 * It is part of the poster, not a bar that follows you: absolutely placed over
 * the top of the hero (which pads itself by --nav-h), with no scroll listener,
 * no observer and no state at rest.
 *
 *  - 1024 and up: links in a row, button on the right.
 *  - 640 to 1023: the links fold into the menu; the button stays.
 *  - under 640: the menu button only. The sheet it opens covers the screen in
 *    ember and carries the links and the button, full width under the thumb.
 */
export function Nav({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

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
      className={`inset-x-0 top-0 z-50 text-ink [--focus:var(--color-ink)] ${
        open ? "fixed bottom-0 flex flex-col overflow-y-auto bg-ember" : "absolute"
      }`}
    >
      <div className="flex h-[var(--nav-h)] shrink-0 items-end gap-11 px-g max-sm:gap-3">
        <a href="#top" className="flex min-h-[46px] items-center gap-3" aria-label="HVNF Studios, back to top">
          <SmallMark className="w-[34px] max-sm:w-[30px]" />
          <b className="font-display text-[24px] font-extrabold leading-none tracking-[-0.03em] max-sm:text-[22px]">HVNF</b>
          <span className="text-[16px] font-medium">Studios</span>
        </a>

        <nav aria-label="Sections" className="max-lg:hidden">
          {/* role=list: Safari drops list semantics from a list with list-style none. */}
          <ul role="list" className="flex gap-[30px] text-[16px] font-semibold">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="inline-flex min-h-[46px] items-center underline-offset-[6px] hover:underline hover:decoration-2">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Button onClick={onStart} size="sm" className="ml-auto max-sm:hidden">
          Ask for a preview
        </Button>

        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          className="btn size-[46px] !min-h-0 !p-0 max-sm:ml-auto lg:hidden"
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
