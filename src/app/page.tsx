"use client";

import { useState, useEffect } from "react";
import Lenis from "lenis";
import { Navbar } from "@/components/studio/navbar";
import { Hero } from "@/components/studio/hero";
import { FlagshipGrid } from "@/components/studio/flagship-grid";
import { Capabilities } from "@/components/studio/capabilities";
import { IntakeDrawer } from "@/components/studio/intake-drawer";
import Footer from "@/components/studio/footer";

export default function HomePage() {
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    } as any);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="relative">
        <Hero onInitiateSprint={() => setIsIntakeOpen(true)} />

        <div id="flagships">
          <FlagshipGrid />
        </div>

        <Capabilities />
      </main>

      <Footer />

      <IntakeDrawer
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
      />
    </>
  );
}
