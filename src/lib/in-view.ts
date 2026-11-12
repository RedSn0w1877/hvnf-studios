/**
 * In-view: the one scroll entrance helper. CSS does the moving; this module
 * only decides WHEN, by writing one attribute per element, once.
 *
 * How to use it
 *  1. Put data-reveal on a block (a section, a row, a card).
 *  2. Give it, or anything inside it, an .rv-* class from globals.css
 *     (rv-rise, rv-fade, rv-wipe, rv-pop, rv-slide, rv-up), and stagger with
 *     style={{ "--d": "80ms" }}.
 *
 *       <ol data-reveal>
 *         <li className="rv-rise">…</li>
 *         <li className="rv-rise" style={{ "--d": "60ms" } as CSSProperties}>…</li>
 *       </ol>
 *
 *  3. That is all. page.tsx calls initInView() once; sections call nothing.
 *     For your own CSS, key off the same attribute:
 *       [data-reveal][data-in=""] .thing { animation: … }   arrived by scrolling
 *       [data-reveal][data-in] .thing { … }                  arrived at all
 *
 * What it does
 *  - Blocks already on screen (or scrolled past) at load get data-in="now" in
 *    one batched read, so nothing the visitor can already see blinks out and
 *    plays back in. CSS only animates data-in="" (arrived by scrolling).
 *  - Blocks below are watched by one shared IntersectionObserver whose line
 *    sits 12% above the bottom edge. Each is released after its first crossing,
 *    and an observer with nothing left to watch does no work. Nothing runs at
 *    rest: no scroll listener, no rAF, no timer.
 *  - html[data-rv] is the hide rule's switch, and only the live path sets it:
 *    the observer's own first callback (every observe() delivers one), proof
 *    that it really runs. Without JS, before this runs, if a script fails, or
 *    if the observer never reports, it is never set and every block is simply
 *    visible. The first report lands a frame after start, when every block
 *    still waiting is below the line, so nothing on screen blinks out.
 *  - Focus (a Tab press) landing inside a block that is still waiting or still
 *    playing in marks it "now": it shows at once, so a focus ring never sits
 *    on something faded out, and keyboard moves never animate. One focusin
 *    listener; it runs only when focus moves.
 *  - Under reduced motion everything is marked "now" and no observer is made.
 *
 * Rules: data-reveal must be in the server HTML (anything mounted later should
 * call observeInView(node) or it would sit hidden), and do not nest one
 * data-reveal inside another.
 */

const PENDING = "[data-reveal]:not([data-in])";
const READY = "data-rv";

// A block arrives once its top clears 88% of the viewport height.
const LINE = 0.88;
const LINE_MARGIN = "0px 0px -12% 0px";
// Backstop for short blocks in the last 12% of the page, which can never reach
// the line: being mostly on screen counts too. Tall blocks cross the line first.
const BACKSTOP_RATIO = 0.85;

type Watch = { line: IntersectionObserver; backstop: IntersectionObserver };

let watch: Watch | null = null;
let holders = 0;
let live = false;

// The observer has reported at least once, so it can be trusted to show what it hides.
function goLive() {
  if (live) return;
  live = true;
  document.documentElement.setAttribute(READY, "");
}

function arrive(el: Element, how: "" | "now" = "") {
  if (el.hasAttribute("data-in")) return;
  el.setAttribute("data-in", how);
  if (!watch) return;
  watch.line.unobserve(el);
  watch.backstop.unobserve(el);
}

// Focus that lands in a block still waiting or still playing in (Tab scrolls
// faster than the line) shows that block at once: keyboard moves never animate,
// and a focus ring must never sit on something at opacity 0.
function onFocusIn(event: FocusEvent) {
  const block = (event.target as Element | null)?.closest?.("[data-reveal]");
  if (!block || block.getAttribute("data-in") === "now") return;
  block.removeAttribute("data-in");
  arrive(block, "now");
}

function start() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pending = Array.from(document.querySelectorAll(PENDING));

  // Every read first, then every write, so the page is laid out once.
  const line = window.innerHeight * LINE;
  const seen = pending.map((el) => reduce || el.getBoundingClientRect().top < line);

  if (!reduce) {
    watch = {
      line: new IntersectionObserver(
        (entries) => {
          goLive();
          for (const entry of entries) if (entry.isIntersecting) arrive(entry.target);
        },
        { rootMargin: LINE_MARGIN },
      ),
      backstop: new IntersectionObserver(
        (entries) => {
          goLive();
          for (const entry of entries) if (entry.intersectionRatio >= BACKSTOP_RATIO) arrive(entry.target);
        },
        { threshold: BACKSTOP_RATIO },
      ),
    };
    document.addEventListener("focusin", onFocusIn);
  }

  pending.forEach((el, i) => {
    if (seen[i] || !watch) {
      el.setAttribute("data-in", "now");
    } else {
      watch.line.observe(el);
      watch.backstop.observe(el);
    }
  });

  // The hide rule is not switched on here: goLive() does it from the first report.
}

function stop() {
  document.removeEventListener("focusin", onFocusIn);
  watch?.line.disconnect();
  watch?.backstop.disconnect();
  watch = null;
  live = false;
  // With nobody watching, nothing may stay hidden.
  document.documentElement.removeAttribute(READY);
}

/**
 * Starts the shared observer. Call once from the page, in an effect, and return
 * its result as the cleanup. Reference counted, so React StrictMode's double
 * mount in development never double-observes or leaves the page gated.
 */
export function initInView(): () => void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return () => {};

  holders += 1;
  if (holders === 1) start();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders -= 1;
    if (holders === 0) stop();
  };
}

/**
 * For a block mounted after the page loaded (rare: everything on the homepage
 * is in the server HTML). Hands the node and any data-reveal inside it to the
 * shared observer. Before initInView() it does nothing, because init's own
 * query will find the node.
 */
export function observeInView(node: Element): void {
  if (holders === 0) return;
  const found = Array.from(node.querySelectorAll(PENDING));
  if (node.matches(PENDING)) found.unshift(node);
  for (const el of found) {
    if (!watch) {
      // Reduced motion: show it, no entrance.
      el.setAttribute("data-in", "now");
    } else {
      watch.line.observe(el);
      watch.backstop.observe(el);
    }
  }
}
