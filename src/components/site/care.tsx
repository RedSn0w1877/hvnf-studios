import type { CSSProperties } from "react";
import { RegisteredHeading } from "./kit";
import { CubeMark, type CubeSubset } from "./cube-mark";

// Each row's glyph lights the part of the cube that row is about, in ember-ink:
// the upright that carries the load, the contour and nothing else, the corner
// nearest you, the brace that keeps it standing.
const PILLARS: readonly { title: string; body: string; highlight: CubeSubset }[] = [
  {
    title: "Built for a phone on a bad signal",
    body:
      "Most of your visitors arrive on a phone, often on mobile data. Pages are kept light and images are sized to the screen asking for them, so the page shows up quickly.",
    highlight: "centerUpright",
  },
  {
    title: "Only what you actually need",
    body:
      "No page builder, no pile of plugins, no theme carrying code for features you will never use. Every part of the page is written for your business.",
    highlight: "outline",
  },
  {
    title: "Findable by the people nearby",
    body:
      "Clear titles, real descriptions and tidy headings, plus the details search engines look for: your address, hours, service area, and pages that answer what people search for.",
    highlight: "nearCorner",
  },
  {
    title: "Kept running after launch",
    body:
      "A care plan covers hosting, security, updates and a monthly note on how the site is doing. Text us a change and we make it. You never have to open a dashboard.",
    highlight: "brace",
  },
];

// Printer's crop marks at the sheet's inner corners. Static: they frame the page,
// they do not perform.
const CROPS = [
  "left-4 top-4 border-l border-t md:left-6 md:top-6",
  "right-4 top-4 border-r border-t md:right-6 md:top-6",
  "bottom-4 left-4 border-b border-l md:bottom-6 md:left-6",
  "bottom-4 right-4 border-b border-r md:bottom-6 md:right-6",
] as const;

const SUB_ENTRY = { "--ld": "140ms" } as CSSProperties;

/*
  Row classes, kept together because the breakpoints only make sense side by side:
  stacked under 640, [glyph | title over body] to 1023, then the 12-column sheet
  (glyph 1, title 4, body 7–12). gap-x-6 keeps a 1024px column at ~56px, so the
  glyph never spills into its neighbour.

  The last three arbitrary variants drive the highlight. Until the shared
  observer marks the row in, its `.cm-hl` waits at 0, hidden instantly (no
  transition, so rows below the fold do no work at init); on arrival the mark's
  own 400ms opacity transition lights it, held back until the row has mostly
  landed so it reads as a second beat (a pen mark), not part of the slide. Gated
  on data-lock-ready, so without JS the marks are simply lit. The `!`s are
  needed: cube-mark.module.css is unlayered and would otherwise win.
*/
const ROW =
  "group relative grid border-b border-rule-paper py-10 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-12 " +
  "[html[data-lock-ready]_&:not([data-in])_.cm-hl]:opacity-0 " +
  "[html[data-lock-ready]_&:not([data-in])_.cm-hl]:transition-none! " +
  "motion-safe:[&_.cm-hl]:[transition-delay:calc(var(--ld,0ms)_+_420ms)]!";

/**
 * Folio three: what you get, as a paper spec sheet. Opaque and full-bleed, it
 * slides over the fixed cube like a sheet laid on the table (the Stage hides
 * itself while the paper covers the screen). No invented uptime figures.
 *
 * No hooks and no client JS of its own: entrances are the shared axis lock, the
 * highlights are CSS keyed off the row's data-in, and the hover rule is a
 * transition on one span.
 */
export function Care() {
  return (
    <section id="care" data-surface="paper" className="relative bg-paper py-28 text-paper-ink md:py-36">
      {CROPS.map((corner) => (
        <span
          key={corner}
          aria-hidden
          className={`pointer-events-none absolute size-3.5 border-paper-ink ${corner}`}
        />
      ))}

      <div className="shell">
        <div data-lock="c">
          <CubeMark size={28} tone="paper" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <RegisteredHeading
            trigger="view"
            tone="paper"
            delay={70}
            wrapperClassName="lg:col-span-7"
            className="t-h2 font-display font-semibold text-paper-ink"
          >
            Fast, plain and yours to keep.
          </RegisteredHeading>
          <p
            data-lock="c"
            style={SUB_ENTRY}
            className="max-w-sm text-[16px] leading-[1.65] text-paper-muted lg:col-span-5 lg:justify-self-end"
          >
            The same care that went into the three builds above, aimed at the thing that pays your bills: the phone
            ringing.
          </p>
        </div>

        {/* role=list: Safari drops list semantics from a list with list-style none. */}
        <ul role="list" className="mt-16 border-t border-rule-paper">
          {PILLARS.map((pillar, i) => (
            <li key={pillar.title} data-lock="c" style={{ "--ld": `${i * 70}ms` } as CSSProperties} className={ROW}>
              <CubeMark
                size={56}
                tone="paper"
                highlight={[pillar.highlight]}
                className="self-start justify-self-start sm:row-span-2 lg:col-span-1 lg:row-span-1"
              />
              <h3 className="t-h3 mt-6 font-display font-semibold text-paper-ink sm:col-start-2 sm:mt-0 lg:col-span-4">
                {pillar.title}
              </h3>
              <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-paper-muted sm:col-start-2 lg:col-span-6 lg:col-start-7 lg:mt-0">
                {pillar.body}
              </p>
              {/* Hover: an ember-ink hairline grows over the row's bottom rule. Scale only, so nothing repaints. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-ember-ink transition-transform duration-[420ms] ease-settle group-hover:scale-x-100"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
