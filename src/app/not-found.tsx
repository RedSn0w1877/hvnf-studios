import type { Metadata } from "next";
import { CubeMark } from "@/components/site/cube-mark";

export const metadata: Metadata = {
  title: "Page not found",
};

// The basePath from next.config.ts, so the link works on GitHub Pages
// (/hvnf-studios/) and on Vercel (/).
const HOME = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;

/**
 * Every unmatched URL, exported as out/404.html. A server component: no Stage,
 * no Lenis, and the mark is plain server-rendered SVG.
 *
 * Next writes the root not-found into every page's payload, the homepage
 * included, so nothing here may be a client component: next/link or a lucide
 * icon would make every visitor download their chunk a second time. Hence a
 * plain <a> and an inline arrow, matching the legal pages' HomeLink.
 */
export default function NotFound() {
  return (
    <main className="shell flex min-h-[100svh] max-w-2xl flex-col justify-center py-20">
      <CubeMark size={64} />
      <h1 className="mt-10 font-display text-[clamp(2.2rem,6vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-bone">
        Page not found
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ash">
        There’s nothing at this address. The link might be old, or a letter got typed wrong.
      </p>
      <a
        href={HOME}
        className="mt-8 inline-flex min-h-11 items-center gap-2 self-start text-[15px] text-muted transition-colors hover:text-bone"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to the homepage
      </a>
    </main>
  );
}
