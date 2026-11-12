import type { CSSProperties } from "react";
import { SHOTS, type PosterFile, type Shot } from "@/assets/work";
import { ArrowOut, Section, TextLink } from "./kit";

/**
 * "A few sites we've made": the Ember Drawing mosaic. An ink title block, then
 * Penner & Daughters as the feature and Kroma, Apex and Aetheria as three
 * tiles, each on its demo's own colour. Each tile is a still of the demo's
 * first screen (no iframes, no embeds) with the demo's own link under it.
 *
 * Motion is transform and opacity only: the tiles rise and fade in as the row
 * scrolls into view (CSS .rv-rise, driven by data-reveal, staggered 60ms), and
 * on a hover-capable screen the poster shifts 6px up inside its frame. Reduced
 * motion: neither plays. With no JavaScript nothing is ever hidden.
 */

type Build = {
  id: string;
  title: string;
  /** What the shop sells, as a plain label. */
  sector: string;
  blurb: string;
  href: string;
  /** The site's first screen, made by posters.mjs (see src/assets/work/index.ts). */
  shot: Shot;
  /** The demo's own ground, the text colour that passes on it, and its accent for the underline. */
  bg: string;
  fg: string;
  line: string;
};

const BUILDS: readonly Build[] = [
  {
    id: "penner",
    title: "Penner & Daughters",
    sector: "Auto repair",
    blurb: "Pick the noise your car is making and hear it. Then approve the repair estimate one line at a time.",
    href: "https://redsn0w1877.github.io/penner-and-daughters/",
    shot: SHOTS.penner,
    bg: "#C9CDD1",
    fg: "#121417",
    line: "#1B44A3",
  },
  {
    id: "kroma",
    title: "Kroma Labs",
    sector: "Keyboards",
    blurb: "Press a key on your own keyboard and the same key goes down in the photo, with the click of the switch you picked.",
    href: "https://redsn0w1877.github.io/kroma-labs/",
    shot: SHOTS.kroma,
    bg: "#F2C200",
    fg: "#15120F",
    line: "#15120F",
  },
  {
    id: "apex",
    title: "Apex Dynamics",
    sector: "Running shoes",
    blurb:
      "Drag a runner along 30 km of hills and watch the heart rate climb, then cut the shoe open from heel to toe.",
    href: "https://redsn0w1877.github.io/apex-dynamics/",
    shot: SHOTS.apex,
    bg: "#0B0C0A",
    fg: "#F2F3EC",
    line: "#CCFF00",
  },
  {
    id: "aetheria",
    title: "Aetheria Botanicals",
    sector: "Perfume",
    blurb: "Pick a top, heart and base note and the drawn bottle fills with the color of the perfume you just made.",
    href: "https://redsn0w1877.github.io/aetheria-botanicals/",
    shot: SHOTS.aetheria,
    bg: "#C7A982",
    fg: "#1E150D",
    line: "#8A3320",
  },
];

// Widths come from the manifest, not the import: Turbopack calls every AVIF 100px wide.
const srcSet = (files: readonly PosterFile[]) => files.map(({ file, width }) => `${file.src} ${width}w`).join(", ");

/** Rendered width of a tile's poster at each breakpoint, so the browser picks the smallest file that is sharp. */
const SIZES_TILE = "(min-width: 1024px) 34vw, 100vw";
const SIZES_FEATURE = "(min-width: 1024px) 50vw, 100vw";

/**
 * The site's own first screen. Lazy and decoded off the main thread: none are
 * near the first screen. The image is 6px taller than its frame and pinned to
 * the top, so the hover shift (up 6px) never shows a gap at the bottom.
 */
function Still({ shot, sizes }: { shot: Shot; sizes: string }) {
  const { desktop } = shot;
  const fallback = desktop.webp[desktop.webp.length - 1];
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(desktop.avif)} sizes={sizes} />
      <img
        src={fallback.file.src}
        srcSet={srcSet(desktop.webp)}
        sizes={sizes}
        width={fallback.width}
        height={fallback.height}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-[calc(100%+6px)] w-full max-w-none object-cover object-left-top transition-transform duration-300 ease-settle motion-safe:group-focus-within:-translate-y-1.5 motion-safe:group-hover:-translate-y-1.5"
      />
    </picture>
  );
}

export function Work() {
  return (
    <Section id="work" surface="ink">
      <div data-reveal className="grid grid-cols-12">
        <div className="rv-rise col-span-4 flex flex-col justify-between gap-7 pb-9 pl-g pr-9 pt-[52px] max-lg:col-span-full max-sm:pr-g max-sm:pt-14">
          <h2 className="t-h2-sm">A few sites we’ve made</h2>
          <p className="t-body max-w-[30em] text-bone-dim">
            We made these brands up so we could go all out. A dentist doesn’t need a spinning perfume bottle, so your
            site will be calmer. Each one’s a working site you can open and click around in.
          </p>
        </div>

        {BUILDS.map((build, i) => {
          const feature = i === 0;
          return (
            <article
              key={build.id}
              style={
                {
                  backgroundColor: build.bg,
                  color: build.fg,
                  "--line": build.line,
                  "--focus": build.fg,
                  "--d": `${(i + 1) * 60}ms`,
                } as CSSProperties
              }
              className={`rv-rise group flex min-w-0 flex-col max-lg:col-span-full ${feature ? "col-span-8 lg:flex-row-reverse" : "col-span-4"}`}
            >
              {/* The poster opens the demo too; the text link below is the keyboard and screen-reader way in. */}
              <a
                href={build.href}
                target="_blank"
                rel="noreferrer"
                tabIndex={-1}
                aria-hidden="true"
                className={`relative block overflow-hidden ${feature ? "aspect-[16/10] lg:aspect-auto lg:h-[400px] lg:flex-1" : "aspect-[16/9.5]"}`}
              >
                <Still shot={build.shot} sizes={feature ? SIZES_FEATURE : SIZES_TILE} />
              </a>
              <div
                className={`flex flex-1 flex-col px-g pb-5 pt-[18px] max-sm:pb-7 ${feature ? "lg:w-[320px] lg:flex-none lg:px-8 lg:pb-8 lg:pt-12" : ""}`}
              >
                <p className="t-small font-semibold">{build.sector}</p>
                <h3 className={`t-h3 mt-1.5 leading-none ${feature ? "lg:text-[40px]" : ""}`}>{build.title}</h3>
                <p className="mt-2.5 max-w-[34em] text-[15px] leading-normal">{build.blurb}</p>
                <TextLink href={build.href} external className="mt-auto self-start pt-2 text-[15px] decoration-[var(--line)]">
                  Visit {build.title}
                  <ArrowOut />
                </TextLink>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
