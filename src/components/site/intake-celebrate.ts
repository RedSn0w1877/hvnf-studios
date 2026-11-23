import type confetti from "canvas-confetti";

/*
 * The send-off: one burst when a request goes through (or the email draft opens). canvas-confetti is
 * fetched on that click and never before. It draws on its own temporary canvas,
 * in a worker where the browser allows, behind the
 * drawer, and the canvas is gone 3s later.
 */

// The poster's inks: ink, ember, bone, cobalt.
const COLOURS = ["#15120f", "#ef4623", "#f1eadb", "#1747d4"];

// A beam and an iso rhombus (the cube's top face). Given no matrix,
// canvas-confetti fits a path itself by probing a 500×500 grid with
// isPointInPath: 60–70ms per shape in Chrome, a long task on the click. These
// matrices skip that: each path drawn at its own 12-unit size, centred on the
// origin. The library wants plain 6-number arrays (it checks Array.isArray
// before drawing a path, and an array crosses postMessage into the worker),
// although its types say DOMMatrix.
const PATHS = [
  { path: "M0 0h12v2H0z", matrix: [1, 0, 0, 1, -6, -1] },
  { path: "M0 3.46 6 0l6 3.46L6 6.93z", matrix: [1, 0, 0, 1, -6, -3.465] },
];

type Burst = { canvas: HTMLCanvasElement; fire: confetti.CreateTypes; timer: number };

let burst: Burst | null = null;
let shapes: confetti.Shape[] | null = null;
let workerFailed = false;

function endBurst() {
  if (!burst) return;
  window.clearTimeout(burst.timer);
  burst.fire.reset();
  burst.canvas.remove();
  burst = null;
}

function launch(lib: typeof confetti, options: confetti.Options, useWorker: boolean): Burst {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "pointer-events-none fixed inset-0 z-[75] h-full w-full";
  document.body.appendChild(canvas);
  try {
    const fire = lib.create(canvas, { resize: true, useWorker, disableForReducedMotion: true });
    const done = fire(options);
    const started: Burst = { canvas, fire, timer: window.setTimeout(endBurst, 3000) };
    if (useWorker) {
      // A shape the worker cannot take rejects here rather than throwing. Redo
      // the burst on the main thread, on a fresh canvas: this one now belongs
      // to the worker.
      done?.catch(() => {
        workerFailed = true;
        if (burst !== started) return;
        endBurst();
        burst = launch(lib, options, false);
      });
    }
    return started;
  } catch (error) {
    canvas.remove();
    throw error;
  }
}

export async function celebrate(from: HTMLElement) {
  // The one layout read, taken before the await (currentTarget does not survive
  // it): the button's centre as a fraction of the viewport the canvas covers.
  const box = from.getBoundingClientRect();
  const origin = {
    x: (box.left + box.width / 2) / window.innerWidth,
    y: (box.top + box.height / 2) / window.innerHeight,
  };
  const lite = document.documentElement.hasAttribute("data-lite");

  let lib: typeof confetti;
  try {
    lib = (await import("canvas-confetti")).default;
  } catch {
    return; // Offline or blocked: the draft opens all the same.
  }

  if (!shapes) {
    try {
      shapes = PATHS.map(({ path, matrix }) => lib.shapeFromPath({ path, matrix: matrix as unknown as DOMMatrix }));
    } catch {
      shapes = ["square"]; // No Path2D in this browser: plain squares.
    }
  }

  const options: confetti.Options = {
    particleCount: lite ? 40 : 70,
    spread: 75,
    startVelocity: 38,
    ticks: 170,
    gravity: 1.05,
    scalar: 1.1,
    origin,
    colors: COLOURS,
    shapes,
  };

  // A second click mid-burst joins the one already in the air.
  if (burst) {
    burst.fire(options);
    window.clearTimeout(burst.timer);
    burst.timer = window.setTimeout(endBurst, 3000);
    return;
  }

  try {
    burst = launch(lib, options, !workerFailed);
  } catch {
    if (workerFailed) return;
    workerFailed = true;
    burst = launch(lib, options, false);
  }
}
