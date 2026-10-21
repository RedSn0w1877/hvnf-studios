/**
 * Device tiers, in one place for both sides of the page.
 *
 * No "use client" on purpose. layout.tsx is a server component and needs
 * liteScript() as a string to inline in <head>; perf.ts runs in the browser and
 * needs the same rules for its live hook. Both read them from here, so the guess
 * made before first paint and the answer React settles on can never drift apart.
 *
 * "Lite" means: no WebGL chunk, no Lenis, no scroll director. Phones, small
 * touch screens, reduced motion, low core counts, low memory, data saver and
 * slow connections all land there.
 */

export const LITE_QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(max-width: 767px)",
  "(pointer: coarse) and (max-width: 1024px)",
] as const;

/** Four cores or fewer, or 4GB or less, is a phone-class budget whatever the screen says. */
export const LITE_MAX_CORES = 4;
export const LITE_MAX_MEMORY_GB = 4;
export const LITE_SLOW_NETWORK = /^(slow-2g|2g|3g)$/;

/**
 * The pre-paint guess, about 350 bytes. It runs while the HTML is still parsing,
 * so CSS can branch on html[data-lite] from the very first frame instead of
 * flashing the desktop layout at a phone. It also marks html.js, so styles can
 * tell a scripted page from a no-JS one. Wrapped in try/catch: a browser that
 * cannot answer is treated as full, and the runtime hook corrects it later.
 */
export function liteScript(): string {
  return (
    `(function(){var d=document.documentElement,n=navigator,c=n.connection||{};d.classList.add("js");` +
    `try{if(${JSON.stringify(LITE_QUERIES)}.some(function(q){return matchMedia(q).matches})` +
    `||(n.hardwareConcurrency>0&&n.hardwareConcurrency<=${LITE_MAX_CORES})` +
    `||n.deviceMemory<=${LITE_MAX_MEMORY_GB}` +
    `||c.saveData===true` +
    `||${LITE_SLOW_NETWORK}.test(c.effectiveType||""))d.setAttribute("data-lite","")}catch(e){}})()`
  );
}
