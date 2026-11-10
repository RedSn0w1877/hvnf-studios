"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useDeviceProfile } from "@/lib/perf";
import { initInView } from "@/lib/in-view";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Work } from "@/components/site/work";
import { Method } from "@/components/site/method";
import { Care } from "@/components/site/care";
import { Closing } from "@/components/site/closing";
import { Intake } from "@/components/site/intake";

const subscribeNever = () => () => {};

/** False on the server and during hydration, true from the first client commit on. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * The homepage, top to bottom: hero (ember), examples (ink mosaic), how it
 * works (cobalt), what you get (bone), closing (ember) and the ink footer.
 *
 * Every section is plain server-rendered HTML with inline SVG drawings. This
 * file only owns the three things that need the browser: the intake drawer's
 * open state, the live lite-device answer, and the one shared in-view observer.
 * There is no scroll library, no canvas and no clock: at rest nothing runs.
 */
export default function HomePage() {
  const [intakeOpen, setIntakeOpen] = useState(false);
  const { lite } = useDeviceProfile();
  const hydrated = useHydrated();
  const openIntake = useCallback(() => setIntakeOpen(true), []);
  const closeIntake = useCallback(() => setIntakeOpen(false), []);

  // Once per page: the shared entrance observer (lib/in-view.ts).
  useEffect(() => initInView(), []);

  // The head script's data-lite is a first guess; the live hook wins after a
  // resize or rotation. Skipped during hydration, when the hook still reports its
  // server placeholder (lite) and would flash the lite treatment on a desktop.
  // Also restores html.js, which React drops on a development StrictMode remount.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.add("js");
    root.toggleAttribute("data-lite", lite);
  }, [hydrated, lite]);

  return (
    <>
      <a
        href="#main"
        className="btn sr-only [--focus:var(--color-ink)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:px-5"
        data-size="sm"
      >
        Skip to content
      </a>

      <Nav onStart={openIntake} />

      <main id="main">
        <Hero onStart={openIntake} />
        <Work />
        <Method />
        <Care />
      </main>

      <Closing onStart={openIntake} />
      <Intake open={intakeOpen} onClose={closeIntake} />
    </>
  );
}
