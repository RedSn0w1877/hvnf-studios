"use client";

import { Gauge, LifeBuoy, Search, Smartphone } from "lucide-react";
import { Reveal, SectionHead, TiltCard, WordReveal } from "./kit";

const PILLARS = [
  {
    icon: Smartphone,
    title: "Built for a phone on a bad signal",
    body:
      "Most of your visitors arrive on a phone, often on mobile data. Pages are kept light and images are sized to the screen asking for them, so the page shows up quickly.",
  },
  {
    icon: Gauge,
    title: "Only what you actually need",
    body:
      "No page builder, no pile of plugins, no theme carrying code for features you will never use. Every part of the page is written for your business.",
  },
  {
    icon: Search,
    title: "Findable by the people nearby",
    body:
      "Clear titles, real descriptions and tidy headings, plus the details search engines look for: your address, hours, service area, and pages that answer what people search for.",
  },
  {
    icon: LifeBuoy,
    title: "Kept running after launch",
    body:
      "A care plan covers hosting, security, updates and a monthly note on how the site is doing. Text us a change and we make it. You never have to open a dashboard.",
  },
] as const;

/** Folio three: what you get, in plain terms. No invented uptime figures. */
export function Care() {
  return (
    <section id="care" className="relative py-28 md:py-36">
      <div className="shell">
        <SectionHead index="03" label="What you get" />

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2
            aria-label="Fast, plain and yours to keep."
            className="text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-bone lg:col-span-7"
          >
            <WordReveal text="Fast, plain and yours to keep." />
          </h2>
          <Reveal className="lg:col-span-5 lg:justify-self-end">
            <p className="max-w-sm text-[15px] leading-relaxed text-ash">
              The same care that went into the three builds above, aimed at the thing that pays your bills: the
              phone ringing.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.06}>
              <TiltCard className="h-full">
                {/*
                  Translucent so the stage drifts behind the grid. The hairlines
                  between cards come from the wrapper's 9%-white fill showing
                  through the 1px gaps, so both layers have to stay see-through.
                */}
                <div className="group h-full bg-carbon/55 p-8 backdrop-blur-[3px] transition-colors duration-500 hover:bg-graphite/70 md:p-10">
                  <pillar.icon
                    className="h-5 w-5 text-ember transition-transform duration-500 group-hover:-translate-y-0.5"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-bone">{pillar.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ash">{pillar.body}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
