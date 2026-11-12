"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useDeviceProfile } from "@/lib/perf";
import { initInView } from "@/lib/in-view";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Work } from "@/components/site/work";
import { Method } from "@/components/site/method";
import { Care } from "@/components/site/care";
import { Closing } from "@/components/site/closing";

/*
 * The intake drawer, and with it motion/react and the drawer's icons, is its
 * own chunk: nobody needs it to read the page. It is fetched once the page has
 * loaded and the browser is idle (skipped on Save-Data), or straight away by
 * the first "Ask for a preview" press if that comes sooner, and it is only
 * mounted from that first press on. Opening it is then a state change, as before.
 */
const loadIntake = () => import("@/components/site/intake");
const Intake = dynamic(() => loadIntake().then((m) => m.Intake), { ssr: false });

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
 * open state (and when its code loads), the live lite-device answer, and the
 * one shared in-view observer.
 * There is no scroll library, no canvas and no clock: at rest nothing runs.
 */
export default function HomePage() {
  const [intakeOpen, setIntakeOpen] = useState(false);
  // False until the first "Ask for a preview": until then the drawer isn't in the tree at all.
  const [intakeWanted, setIntakeWanted] = useState(false);
  const { lite } = useDeviceProfile();
  const hydrated = useHydrated();
  const openIntake = useCallback(() => {
    setIntakeWanted(true);
    setIntakeOpen(true);
  }, []);
  const closeIntake = useCallback(() => setIntakeOpen(false), []);

  // Once per page: the shared entrance observer (lib/in-view.ts).
  useEffect(() => initInView(), []);

  // Warm the drawer's chunk once, after load, when the main thread is free, so
  // the first press opens it without a network wait. One fetch, then nothing.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    let idle = 0;
    let timer = 0;
    const warm = () => {
      const run = () => void loadIntake().catch(() => {});
      // Safari has no requestIdleCallback: a short timeout after load stands in.
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 4000 });
      else timer = window.setTimeout(run, 1500);
    };
    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });
    return () => {
      window.removeEventListener("load", warm);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

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
      {intakeWanted ? <Intake open={intakeOpen} onClose={closeIntake} /> : null}
    </>
  );
}
