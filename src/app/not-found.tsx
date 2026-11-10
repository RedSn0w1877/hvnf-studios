import type { Metadata } from "next";
import { ClosingCube, SmallMark } from "@/components/site/cube-art";

export const metadata: Metadata = {
  title: "Page not found",
};

// The basePath from next.config.ts, so the link works on GitHub Pages
// (/hvnf-studios/) and on Vercel (/).
const HOME = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;

/**
 * Every unmatched URL, exported as out/404.html. A server component: the poster
 * cube is plain inline SVG and there is no script at all.
 *
 * Next writes the root not-found into every page's payload, the homepage
 * included, so nothing here may be a client component: next/link or an icon
 * library would make every visitor download their chunk a second time. Hence a
 * plain <a> and an inline arrow, matching the legal pages' HomeLink.
 *
 * It is the homepage's closing block: ember field, the headline at poster size,
 * the square ink button, the solid ink cube cut off at the bottom-right corner.
 */
export default function NotFound() {
  return (
    <main
      data-surface="ember"
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-g pb-16 pt-5 max-sm:pb-12"
    >
      <SmallMark className="w-9" />
      <div className="relative z-10 my-auto py-16">
        <h1 className="t-h1">Page not found</h1>
        <p className="t-lead mt-8 max-w-[26em]">
          There’s nothing at this address. The link might be old, or a letter got typed wrong.
        </p>
        <a href={HOME} className="btn mt-8 max-sm:w-full">
          <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden focusable="false">
            <path d="M14 8H3M8 3 3 8l5 5" />
          </svg>
          Back to the homepage
        </a>
      </div>
      <ClosingCube className="pointer-events-none absolute -bottom-[13vw] -right-[4vw] w-[43vw] max-sm:-bottom-[22vw] max-sm:-right-[12vw] max-sm:w-[64vw]" />
    </main>
  );
}
