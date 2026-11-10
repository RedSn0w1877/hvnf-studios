import Link from "next/link";
import type { ReactNode } from "react";
import { SmallMark } from "./cube-art";

export type Clause = { heading: string; body: ReactNode };

/** The back arrow, drawn inline (the same path the 404 uses) so no icon library is loaded. */
function BackArrow() {
  return (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden focusable="false">
      <path d="M14 8H3M8 3 3 8l5 5" />
    </svg>
  );
}

/**
 * The way back to the homepage on Terms and Privacy. The 404 draws the same
 * link without next/link (see app/not-found.tsx), so keep the two in step.
 *
 * "link" is the semibold underlined text link (the page head, on ember).
 * "button" is the square button, bone on the ink footer.
 */
export function HomeLink({ className, variant = "link" }: { className?: string; variant?: "link" | "button" }) {
  const base = variant === "button" ? "btn" : "link";
  return (
    <Link href="/" className={className ? `${base} ${className}` : base} data-tone={variant === "button" ? "bone" : undefined}>
      <BackArrow />
      Back to the homepage
    </Link>
  );
}

/**
 * Shared layout for Terms and Privacy, built from the homepage's blocks: an
 * ember head with the title at section-heading size, a bone sheet of numbered
 * clauses (an ink number square, the heading on the left and the text on the
 * right, like the notes on a working drawing), and an ink foot with the way
 * back. `summary` is an optional plain-language line under the title; the
 * clauses themselves stay formal.
 */
export function LegalPage({
  title,
  updated,
  summary,
  clauses,
}: {
  title: string;
  updated: string;
  summary?: string;
  clauses: Clause[];
}) {
  return (
    <main id="main">
      <header data-surface="ember" className="px-g pb-12 pt-5 max-sm:pb-10 sm:pb-16">
        <div className="mx-auto max-w-[84rem]">
          <div className="flex items-center justify-between gap-4">
            <HomeLink />
            <SmallMark className="w-8 shrink-0" />
          </div>
          <h1 className="t-h2 mt-12 max-sm:mt-10">{title}</h1>
          <p className="t-small mt-6">Last updated {updated}</p>
          {summary ? <p className="t-lead mt-6 max-w-[34em]">{summary}</p> : null}
        </div>
      </header>

      <div data-surface="bone" className="band px-g pb-16 pt-4 max-sm:pb-12">
        <div className="mx-auto max-w-[84rem]">
          {clauses.map((clause, i) => (
            <section
              key={clause.heading}
              className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-g gap-y-4 border-t-2 border-ink py-8 first:border-t-0 max-lg:grid-cols-1"
            >
              <h2 className="t-h3 flex items-start gap-3.5">
                <b aria-hidden className="num" data-size="sm">
                  {i + 1}
                </b>
                <span className="pt-px">{clause.heading}</span>
              </h2>
              <div className="t-body max-w-[40rem] space-y-3 max-lg:pl-[calc(28px+0.875rem)] max-sm:pl-0">{clause.body}</div>
            </section>
          ))}
        </div>
      </div>

      <footer data-surface="ink" className="band px-g py-10">
        <div className="mx-auto max-w-[84rem]">
          <HomeLink variant="button" />
        </div>
      </footer>
    </main>
  );
}
