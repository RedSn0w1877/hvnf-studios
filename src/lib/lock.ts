/**
 * Axis lock: the one entrance on the page.
 *
 * Elements opt in with data-lock="a" | "b" | "c" | "none" and an optional
 * style="--ld:140ms" delay. globals.css owns the motion; this module only
 * decides WHEN, by setting data-in once per element and never again.
 *
 *  - Everything already on screen (or scrolled past) at init is marked in AND
 *    data-instant in one batched read, so nothing the visitor can already see
 *    ever blinks out and plays back in.
 *  - Everything below is watched by one shared IntersectionObserver whose line
 *    sits 12% above the bottom edge, and is released after its first crossing.
 *  - A MutationObserver catches nodes React mounts later (Work's orbit/stack
 *    swap, anything conditional), so a late element can never be stranded hidden.
 *
 * Without JS, data-lock-ready is never set and the hide rule never matches, so
 * every element is simply visible. Under reduced motion every element is marked
 * in at once and no IntersectionObserver runs at all.
 */

const SELECTOR = "[data-lock]";
const PENDING = "[data-lock]:not([data-in])";
const READY = "data-lock-ready";

// The entrance line: an element arrives once its top clears 88% of the viewport.
const LINE_MARGIN = "0px 0px -12% 0px";

// Backstop for short elements sitting in the last 12% of the page. The document
// runs out before they can reach the line, so arriving mostly on screen counts
// too. Tall elements never hit this ratio; they always cross the line first.
const BACKSTOP_RATIO = 0.85;

type Lock = {
  line: IntersectionObserver;
  backstop: IntersectionObserver;
  mutations: MutationObserver;
  reduce: boolean;
};

let lock: Lock | null = null;
let holders = 0;

function arrive(el: Element) {
  el.setAttribute("data-in", "");
  if (!lock) return;
  lock.line.unobserve(el);
  lock.backstop.unobserve(el);
}

function arriveInstantly(el: Element) {
  el.setAttribute("data-instant", "");
  arrive(el);
}

function watch(el: Element) {
  if (!lock || !el.isConnected || el.hasAttribute("data-in")) return;
  if (lock.reduce) {
    arriveInstantly(el);
    return;
  }
  lock.line.observe(el);
  lock.backstop.observe(el);
}

function forget(el: Element) {
  // A node React moved is removed and re-added in the same batch; only let go of
  // the ones that really left the document.
  if (!lock || el.isConnected) return;
  lock.line.unobserve(el);
  lock.backstop.unobserve(el);
}

/** The node itself (if it opts in) plus every opted-in descendant. */
function within(node: Element, selector: string): Element[] {
  const found = Array.from(node.querySelectorAll(selector));
  if (node.matches(selector)) found.unshift(node);
  return found;
}

function onMutations(records: MutationRecord[]) {
  for (const record of records) {
    record.removedNodes.forEach((node) => {
      if (node instanceof Element) within(node, SELECTOR).forEach(forget);
    });
    record.addedNodes.forEach((node) => {
      if (node instanceof Element) within(node, PENDING).forEach(watch);
    });
  }
}

function start() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pending = Array.from(document.querySelectorAll(PENDING));

  // Every read first, then every write. Interleaving getBoundingClientRect with
  // setAttribute would force a fresh layout for each element.
  const vh = window.innerHeight;
  const seen = pending.map((el) => reduce || el.getBoundingClientRect().top < vh);

  lock = {
    line: new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) arrive(entry.target);
      },
      { rootMargin: LINE_MARGIN },
    ),
    backstop: new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.intersectionRatio >= BACKSTOP_RATIO) arrive(entry.target);
      },
      { threshold: BACKSTOP_RATIO },
    ),
    // Body, not just main/footer: an opted-in node mounted anywhere after init
    // must still be found, or the hide rule would keep it invisible for good.
    mutations: new MutationObserver(onMutations),
    reduce,
  };
  lock.mutations.observe(document.body, { childList: true, subtree: true });

  pending.forEach((el, i) => (seen[i] ? arriveInstantly(el) : watch(el)));

  // Last: the hide rule only switches on once every element has been sorted, so
  // nothing on screen is ever hidden for even one frame.
  document.documentElement.setAttribute(READY, "");
}

function stop() {
  if (!lock) return;
  lock.line.disconnect();
  lock.backstop.disconnect();
  lock.mutations.disconnect();
  lock = null;
  // With nobody watching, nothing may stay hidden: drop the gate and show it all.
  document.documentElement.removeAttribute(READY);
}

/**
 * Starts the shared observers. Idempotent and reference counted, so React
 * StrictMode's mount → unmount → mount in development, or two callers, never
 * double-observe or leave the page gated. Returns the matching release.
 */
export function initLock(): () => void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return () => {};

  holders += 1;
  if (!lock) start();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders -= 1;
    if (holders === 0) stop();
  };
}

/**
 * Hands a late-mounted subtree to the shared observer straight away, without
 * waiting for the MutationObserver's microtask. Optional: the MutationObserver
 * finds it anyway. Before initLock() it does nothing, because init's own query
 * will pick the element up.
 */
export function observeLock(el: Element): void {
  if (!lock) return;
  within(el, PENDING).forEach(watch);
}
