import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export type Clause = { heading: string; body: ReactNode };

/** Shared layout for Terms and Privacy: one readable column, numbered clauses. */
export function LegalPage({ title, updated, clauses }: { title: string; updated: string; clauses: Clause[] }) {
  return (
    <main className="shell max-w-2xl py-20 md:py-28">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted transition-colors hover:text-bone"
      >
        <ArrowLeft size={14} aria-hidden />
        Back to the studio
      </Link>

      <h1 className="mt-12 text-[clamp(2.2rem,6vw,3.2rem)] font-semibold tracking-[-0.03em] text-bone">{title}</h1>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">Last updated {updated}</p>

      <div className="mt-14 flex flex-col gap-10">
        {clauses.map((clause, i) => (
          <section key={clause.heading} className="border-t border-rule pt-6">
            <h2 className="flex items-baseline gap-4 text-xl font-semibold tracking-tight text-bone">
              <span className="font-mono text-[11px] tracking-[0.24em] text-ember">
                {String(i + 1).padStart(2, "0")}
              </span>
              {clause.heading}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ash">{clause.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
