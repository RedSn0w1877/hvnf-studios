"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Reveal, SectionHead, SETTLE, WordReveal } from "./kit";

const STEPS = [
  {
    n: "01",
    title: "We build first, then talk",
    body:
      "You get a working preview of your own site before you pay anything. We build it from what is already public about your business. Open it on your phone and press the call button.",
  },
  {
    n: "02",
    title: "You mark it up",
    body:
      "Tell us what is wrong — the photos, the wording, the services you no longer offer. We work through your list together until the site sounds like your business.",
  },
  {
    n: "03",
    title: "We finish the build",
    body:
      "Half up front, then we finish the pages: your words, your photos, titles that help you show up in search, and forms and booking that reach you. Every page is checked on a phone.",
  },
  {
    n: "04",
    title: "It goes live in your name",
    body:
      "You pay the rest before the domain moves. The domain, the hosting and the code all end up in your accounts, so the site is yours even if you stop working with us.",
  },
] as const;

/**
 * How a build runs. The spine between the steps draws itself as you descend —
 * a single scaleY tween, so it costs one transform per frame and nothing else.
 */
export function Method() {
  const section = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const spine = section.current?.querySelector<HTMLElement>("[data-spine]");
        if (!spine) return;
        gsap.fromTo(
          spine,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top",
            scrollTrigger: { trigger: section.current, start: "top 65%", end: "bottom 75%", scrub: 0.6 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="method" className="relative py-28 md:py-36">
      <div className="shell">
        <SectionHead index="02" label="How a build runs" />

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2
            aria-label="You see the site before you pay for it."
            className="text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-bone lg:col-span-7"
          >
            <WordReveal text="You see the site before you pay for it." />
          </h2>
          <Reveal className="lg:col-span-5 lg:justify-self-end">
            <p className="max-w-sm text-[15px] leading-relaxed text-ash">
              Most studios sell you a plan and a timeline. We would rather hand you the site and let you judge it.
            </p>
          </Reveal>
        </div>

        <ol className="relative mt-20 flex flex-col gap-14 pl-10 md:pl-16">
          {/* The spine and its travelling fill */}
          <span aria-hidden className="absolute bottom-2 left-[3px] top-2 w-px bg-rule md:left-[7px]" />
          <span
            data-spine
            aria-hidden
            className="absolute bottom-2 left-[3px] top-2 w-px origin-top bg-gradient-to-b from-ember via-ember/60 to-transparent md:left-[7px]"
          />

          {STEPS.map((step, i) => (
            <motion.li
              key={step.n}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -18% 0px" }}
              transition={{ duration: 0.8, ease: SETTLE, delay: i * 0.05 }}
              className="relative"
            >
              <span
                aria-hidden
                className="absolute -left-10 top-2 h-[7px] w-[7px] rounded-full bg-ember md:-left-16 md:h-[15px] md:w-[15px] md:border-4 md:border-ink"
              />
              <div className="flex flex-wrap items-baseline gap-4">
                <span className="font-mono text-[11px] tracking-[0.3em] text-ember">{step.n}</span>
                <h3 className="text-xl font-semibold tracking-tight text-bone md:text-2xl">{step.title}</h3>
              </div>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ash">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
