"use client";

import Link from "next/link";
import { Magnetic, Reveal, WordReveal } from "./kit";

const STUDIO_EMAIL = "studio@hvnf.dev";

/** The last thing on the page: one ask, one alternative, then the small print. */
export function Closing({ onStart }: { onStart: () => void }) {
  const year = 2026;

  return (
    <footer className="relative border-t border-rule">
      <div className="shell py-24 md:py-32">
        <h2
          aria-label="Tell us about the business. We will build the first version."
          className="max-w-[16ch] text-[clamp(2.2rem,6vw,4.4rem)] font-semibold leading-[1] tracking-[-0.03em] text-bone"
        >
          <WordReveal text="Tell us about the business." />
          <WordReveal text="We will build the first version." delay={0.2} className="text-ash" />
        </h2>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Magnetic onClick={onStart}>Start a project</Magnetic>
            <Magnetic href={`mailto:${STUDIO_EMAIL}`} variant="ghost">
              {STUDIO_EMAIL}
            </Magnetic>
          </div>
        </Reveal>

        <div className="mt-24 flex flex-col gap-6 border-t border-rule pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-sm font-semibold tracking-tight text-bone">HVNF</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Studios</span>
          </div>

          <nav aria-label="Legal" className="flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            <Link href="/legal/terms" className="transition-colors hover:text-bone">
              Terms
            </Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-bone">
              Privacy
            </Link>
            <span className="text-muted/70">© {year} HVNF Studios</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
