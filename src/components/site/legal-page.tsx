import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export type Clause = { heading: string; body: ReactNode };

/**
 * The way back to the homepage on Terms and Privacy. The 404 draws the same
 * link without next/link or lucide (see app/not-found.tsx), so keep the two in step.
 */
export function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center gap-2 text-[15px] text-muted transition-colors hover:text-bone ${className ?? ""}`}
    >
      <ArrowLeft size={16} aria-hidden />
      Back to the homepage
    </Link>
  );
}

/**
 * Shared layout for Terms and Privacy: one readable column, numbered clauses.
 * `summary` is an optional plain-language line under the title; the clauses
 * themselves stay formal.
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
    <main className="shell max-w-2xl py-20 md:py-28">
      <HomeLink />

      <h1 className="mt-12 font-display text-[clamp(2.2rem,6vw,3.2rem)] font-semibold tracking-[-0.03em] text-bone">
        {title}
      </h1>
      <p className="mt-3 text-[15px] text-muted">Last updated {updated}</p>
      {summary ? <p className="mt-8 text-[17px] leading-relaxed text-ash">{summary}</p> : null}

      <div className="mt-14 flex flex-col gap-10">
        {clauses.map((clause, i) => (
          <section key={clause.heading} className="border-t border-rule pt-6">
            <h2 className="flex items-baseline gap-4 font-display text-lg font-semibold leading-snug tracking-[-0.012em] text-bone sm:text-xl">
              <span className="font-sans text-[15px] font-medium text-ember">{i + 1}</span>
              {clause.heading}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ash">{clause.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
