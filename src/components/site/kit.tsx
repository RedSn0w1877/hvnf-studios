import type { MouseEvent, ReactNode } from "react";

/**
 * Shared primitives for the "Ember Drawing" look. All of them are plain markup
 * over classes in globals.css: no hooks, no client JS, so they work in server
 * and client components alike. Anything that moves is transform or opacity.
 *
 *   <Button>        the square ink button (56px, or 46px with size="sm")
 *   <TextLink>      the semibold underlined link, 44px tall
 *   <NumberSquare>  the ink square with a bone numeral (the promises' 1 to 4)
 *   <Section>       a colour block: sets the field, text colour and focus ring
 *   <SectionHead>   the big h2 on the left with one line beside it
 *   <ArrowDown>, <ArrowOut>   the two arrows, drawn to sit beside text
 */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ── Button ──────────────────────────────────────────────────────────────── */

export type ButtonProps = {
  children: ReactNode;
  /** With href it renders an <a>; without, a <button type="button">. */
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** "md" 56px tall (default). "sm" 46px, for the nav. */
  size?: "md" | "sm";
  /**
   * "ink" (default): ink block, bone text. For ember, bone and cobalt ground.
   * "ember" / "bone": for ink ground, where an ink block would vanish. Ink text.
   */
  tone?: "ink" | "ember" | "bone";
  /** Full width of its container (the phone layout's under-the-thumb button). */
  block?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  /** Links only. */
  target?: string;
  rel?: string;
};

/**
 * The one button. Square corners, a flat fill, and a flat overlay that fades in
 * on hover and keyboard focus (CSS only, in globals.css under .btn).
 *
 *   <Button onClick={onStart}>Ask for a preview</Button>
 *   <Button size="sm" onClick={onStart}>Ask for a preview</Button>
 *   <Button onClick={onStart} className="max-sm:w-full">Ask for a preview</Button>
 */
export function Button({
  children,
  href,
  onClick,
  size = "md",
  tone = "ink",
  block = false,
  disabled = false,
  className,
  ariaLabel,
  target,
  rel,
}: ButtonProps) {
  const shared = {
    className: cx("btn", className),
    "data-size": size,
    "data-tone": tone,
    "data-block": block ? "" : undefined,
    "aria-label": ariaLabel,
    onClick,
  };
  if (href) {
    return (
      <a href={href} target={target} rel={rel} {...shared}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" disabled={disabled} {...shared}>
      {children}
    </button>
  );
}

/* ── Text link ───────────────────────────────────────────────────────────── */

export type TextLinkProps = {
  children: ReactNode;
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Opens in a new tab and says so to screen readers. */
  external?: boolean;
  className?: string;
};

/**
 * Semibold text with a 2px underline and a 44px tap target. It takes the text
 * colour around it. Change the underline colour with a decoration-* utility
 * (the demo tiles use their own brand colour).
 *
 *   <TextLink href="#work">See examples <ArrowDown /></TextLink>
 *   <TextLink href={url} external>Visit Kroma Labs <ArrowOut /></TextLink>
 */
export function TextLink({ children, href, onClick, external = false, className }: TextLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cx("link", className)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

/* ── Number square ───────────────────────────────────────────────────────── */

/**
 * The promises' number: an ink square with a bone Bricolage numeral. The hero
 * callouts and the "What you get" cells use the same 1 to 4, so the square is
 * what ties a callout to its promise. Decorative by default (aria-hidden): the
 * list order already carries the number.
 *
 *   <NumberSquare n={1} />             36px
 *   <NumberSquare n={1} size="sm" />   28px
 *   <NumberSquare n={1} size="xs" />   24px (the phone hero key)
 *   <NumberSquare n={1} tone="bone" /> bone square, ink numeral, for ink ground
 */
export function NumberSquare({
  n,
  size = "md",
  tone = "ink",
  className,
}: {
  n: number;
  size?: "md" | "sm" | "xs";
  tone?: "ink" | "bone";
  className?: string;
}) {
  return (
    <b aria-hidden className={cx("num", className)} data-size={size} data-tone={tone}>
      {n}
    </b>
  );
}

/* ── Section shells ──────────────────────────────────────────────────────── */

export type Surface = "ember" | "ink" | "bone" | "cobalt";

/**
 * A full-bleed colour block. data-surface gives it the field, the text colour
 * that passes on it, the focus ring that shows on it and a selection colour.
 * It adds no padding: use px-g for the page gutter and your own top and bottom.
 *
 *   <Section id="method" surface="cobalt" band className="px-g pt-[72px] max-sm:pt-14">
 *
 * `band` is the 8px ink band along the top, for where the block above is a
 * different colour.
 */
export function Section({
  as: Tag = "section",
  id,
  surface,
  band = false,
  className,
  children,
}: {
  as?: "section" | "header" | "footer" | "div";
  id?: string;
  surface: Surface;
  band?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} data-surface={surface} className={cx(band && "band", className)}>
      {children}
    </Tag>
  );
}

/**
 * A section's heading row: the 104px h2 on the left, one line of supporting
 * copy on the right, sharing a baseline. One column on phones.
 *
 *   <SectionHead title="How it works">If you don’t like the preview, …</SectionHead>
 */
export function SectionHead({
  title,
  children,
  className,
}: {
  title: ReactNode;
  /** The line beside the heading. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-end gap-8 max-sm:grid-cols-1 max-sm:gap-3.5",
        className,
      )}
    >
      <h2 className="t-h2">{title}</h2>
      {children ? <p className="t-sub max-w-[22em] pb-[0.5em]">{children}</p> : null}
    </div>
  );
}

/* ── Arrows ──────────────────────────────────────────────────────────────── */

/** Down arrow, 0.95em, in the text colour. For "See examples". */
export function ArrowDown({ className }: { className?: string }) {
  return (
    <svg className={cx("ico", className)} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden focusable="false">
      <path d="M8 2v11M3 8.5 8 13.5l5-5" />
    </svg>
  );
}

/** Up-and-out arrow, 0.95em, in the text colour. For links that leave the site. */
export function ArrowOut({ className }: { className?: string }) {
  return (
    <svg className={cx("ico", className)} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden focusable="false">
      <path d="M4 12 12 4M5.5 4H12v6.5" />
    </svg>
  );
}
