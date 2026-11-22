import { Button, Section } from "./kit";
import { Portfolio } from "@/components/portfolio/portfolio";

/**
 * "A few sites we've made": the portfolio bento. Under the title and the
 * intro, one sticky stage morphs from demo to demo as you scroll (the same
 * stage as /portfolio, here without its own page chrome). Penner & Daughters
 * is first; its anchor is #work-penner, which the hero's small preview links
 * to. Under the last demo, one more way into the intake drawer.
 */

export function Work({ onStart }: { onStart: () => void }) {
  return (
    <Section id="work" surface="ink">
      <div data-reveal className="rv-rise max-w-[46rem] px-g pb-10 pt-[52px] max-sm:pb-8 max-sm:pt-14">
        <h2 className="t-h2-sm">A few sites we’ve made</h2>
        <p className="t-body mt-5 max-w-[34em] text-bone-dim">
          We made these brands up so we could go all out. A dentist doesn’t need a spinning perfume bottle, so your site
          will be calmer. Each one’s a working site you can open and click around in.
        </p>
      </div>

      <Portfolio embedded anchorId="work-penner" />

      {/* After the last example, before How it works: the same drawer as the hero's button. */}
      <div className="flex px-g pb-14 pt-10 max-sm:pb-12 max-sm:pt-8">
        <Button tone="ember" onClick={onStart} className="max-sm:w-full">
          Ask for my website preview
        </Button>
      </div>
    </Section>
  );
}
