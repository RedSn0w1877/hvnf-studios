import type { CSSProperties } from "react";
import { RegisteredHeading } from "./kit";

// Spec rows: a plain title, then what it means for you. Every claim here is true
// of this page too, which is why the first row can point at it.
const PILLARS: readonly { title: string; body: string }[] = [
  {
    title: "Loads fast on a weak signal",
    body:
      "Chances are most people find you on their phone, often on cell data. We keep pages light and size every photo to fit the screen. This page does it too. On a phone it skips the 3D and shows a simple drawing instead.",
  },
  {
    title: "Made from scratch",
    body:
      "We write every page ourselves instead of starting from a template or a site builder, so there’s nothing on it you don’t need.",
  },
  {
    title: "Set up so people nearby can find you",
    body:
      "We put your address, hours and service area on the site the way Google expects, and write pages that answer what people near you search for.",
  },
  {
    title: "We can look after it",
    body:
      "Our care plan is optional and paid monthly. We host the site, keep it secure, watch that it stays up and send you a short email each month on how it’s doing. New hours or a new photo? Send it over and we’ll put it up. You never have to open a dashboard.",
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
  A ruled spec row: title over body below 1024, then [title | body] on the
  12-column sheet (title 1–5, body 7–12), the two lined up on their first
  baseline. Each row enters with the shared axis lock, staggered by --ld.
*/
const ROW = "group relative grid border-b border-rule-paper py-10 lg:grid-cols-12 lg:items-baseline lg:gap-x-8";

/**
 * Folio three: what you get, as a paper spec sheet. Opaque and full-bleed, it
 * slides over the fixed cube like a sheet laid on the table (the Stage hides
 * itself while the paper covers the screen). A document title, one line under
 * it, then the rows. No icons and no invented uptime figures.
 *
 * No hooks and no client JS of its own: entrances are the shared axis lock and
 * the hover rule is a transition on one span.
 */
export function Care() {
  return (
    <section id="care" data-surface="paper" className="relative bg-paper py-28 text-paper-ink">
      {CROPS.map((corner) => (
        <span
          key={corner}
          aria-hidden
          className={`pointer-events-none absolute size-3.5 border-paper-ink ${corner}`}
        />
      ))}

      <div className="shell">
        <RegisteredHeading trigger="view" tone="paper" className="t-h2 font-display font-semibold text-paper-ink">
          What you get
        </RegisteredHeading>
        <p data-lock="c" style={SUB_ENTRY} className="mt-3 max-w-[34rem] text-balance text-[16px] leading-[1.65] text-paper-muted">
          Most of it comes down to getting your phone to ring.
        </p>

        {/* role=list: Safari drops list semantics from a list with list-style none. */}
        <ul role="list" className="mt-10 border-t border-rule-paper">
          {PILLARS.map((pillar, i) => (
            <li key={pillar.title} data-lock="c" style={{ "--ld": `${i * 70}ms` } as CSSProperties} className={ROW}>
              <h3 className="t-h3 font-display font-semibold text-paper-ink lg:col-span-5">{pillar.title}</h3>
              <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.65] text-paper-muted lg:col-span-6 lg:col-start-7 lg:mt-0">
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
