"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Magnetic, SETTLE, WordReveal } from "./kit";

const HEADLINE = "Websites that load fast and turn visitors into booked work.";

const MARKS = [
  { k: "Built on", v: "Next.js" },
  { k: "Shipped in", v: "Days, not months" },
  { k: "Ownership", v: "Yours, outright" },
] as const;

/**
 * Folio zero. The reactive wire terrain behind this lives in the shared canvas
 * (see stage.tsx) — the hero itself stays plain DOM so the text paints immediately
 * and never waits on WebGL.
 */
export function Hero({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion();

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pb-24 pt-28">
      <div className="shell w-full">
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: SETTLE }}
          className="eyebrow"
        >
          HVNF Studios — web studio for local business
        </motion.p>

        <h1
          aria-label={HEADLINE}
          className="mt-8 max-w-[19ch] text-[clamp(2.6rem,7vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-bone"
        >
          <WordReveal text="Websites that load fast" immediate />
          <WordReveal text="and turn visitors into" immediate delay={0.16} className="text-ash" />
          <WordReveal text="booked work." immediate delay={0.32} className="text-ember" />
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: SETTLE, delay: 0.5 }}
          className="mt-10 max-w-xl text-[17px] leading-relaxed text-ash"
        >
          We replace slow, dated sites for trades, clinics, salons and shops with hand-built ones: mobile first,
          quick on a phone signal, and wired so a visitor can call or book without hunting for the button.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: SETTLE, delay: 0.62 }}
          className="mt-12 flex flex-wrap items-center gap-4"
        >
          <Magnetic onClick={onStart}>Start a project</Magnetic>
          <Magnetic href="#work" variant="ghost">
            See the work
            <ArrowDown size={14} aria-hidden />
          </Magnetic>
        </motion.div>

        <motion.dl
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: SETTLE, delay: 0.8 }}
          className="mt-20 grid max-w-2xl grid-cols-1 gap-px border-y border-rule sm:grid-cols-3"
        >
          {MARKS.map((mark) => (
            <div key={mark.k} className="py-5 sm:px-5 sm:first:pl-0">
              <dt className="eyebrow">{mark.k}</dt>
              <dd className="mt-2 font-mono text-sm text-bone">{mark.v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
