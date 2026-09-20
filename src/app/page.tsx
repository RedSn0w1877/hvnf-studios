"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { useDeviceProfile } from "@/lib/perf";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Work } from "@/components/site/work";
import { Method } from "@/components/site/method";
import { Care } from "@/components/site/care";
import { Closing } from "@/components/site/closing";
import { Intake } from "@/components/site/intake";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const Stage = dynamic(() => import("@/components/site/stage").then((module) => module.Stage), { ssr: false });

export default function HomePage() {
  const [intakeOpen, setIntakeOpen] = useState(false);
  const { lite } = useDeviceProfile();
  const closeIntake = useCallback(() => setIntakeOpen(false), []);

  useEffect(() => {
    if (lite || intakeOpen) return;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true, autoToggle: true });

    // One clock for the page: GSAP's ticker drives Lenis, and each Lenis scroll
    // updates ScrollTrigger. A second requestAnimationFrame loop would just be two
    // loops competing every frame.
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [lite, intakeOpen]);

  return (
    <>
      <div aria-hidden className="sky" />
      {!lite ? <Stage /> : null}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-ember focus:px-5 focus:py-3 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-ink"
      >
        Skip to content
      </a>

      <Nav onStart={() => setIntakeOpen(true)} />

      <main id="main">
        <Hero onStart={() => setIntakeOpen(true)} />
        <Work />
        <Method />
        <Care />
      </main>

      <Closing onStart={() => setIntakeOpen(true)} />
      <Intake open={intakeOpen} onClose={closeIntake} />
    </>
  );
}
