"use client";

import { Gauge, LifeBuoy, Search, Smartphone } from "lucide-react";
import { Reveal, SectionHead, TiltCard, WordReveal } from "./kit";

const PILLARS = [
  {
    icon: Smartphone,
    title: "Built for a phone on a bad signal",
    body:
      "Most of your visitors arrive on a phone, often on mobile data. Pages are built light and images are sized for the screen that asks for them, so the first thing they see arrives quickly.",
  },
  {
    icon: Gauge,
    title: "Nothing we did not put there",
    body:
      "No page builder, no plugin stack, no theme dragging along code for features you will never use. Every part of the page is written for your business and can be read by a human.",
  },
  {
    icon: Search,
    title: "Findable by the people nearby",
    body:
      "Proper titles, real descriptions, clean headings, and the local details search engines look for: address, hours, service area, and the pages that answer what people actually type.",
  },
  {
    icon: LifeBuoy,
    title: "Kept running after launch",
    body:
      "A care plan covers hosting, the certificate, updates and a monthly note on how the site is doing. Text us a change and it happens — you never open a dashboard unless you want to.",
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
              The same care that went into the three showcase builds, pointed at the thing that pays your bills: the
              phone ringing.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.06}>
              <TiltCard className="h-full">
                <div className="group h-full bg-carbon p-8 transition-colors duration-500 hover:bg-graphite md:p-10">
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
