import type { CSSProperties, ReactNode } from "react";
import { HERO_CALLOUTS, cubePoint, type CubePart } from "./cube-art";
import { SHOTS, type PosterFile } from "@/assets/work";
import { HeroCube } from "./hero-cube";
import { ArrowDown, Button, Section, TextLink } from "./kit";
import s from "./hero.module.css";

/**
 * Hero (ember): the headline, the ink "Try yours before you pay." bar, the
 * lead and the two ways in, with the logo's cube drawn huge behind them and
 * its four parts numbered. The numbers are the four promises further down
 * (1 top face, 2 left face, 3 right face, 4 brace), worded exactly as the
 * "What you get" headings.
 *
 * Server-rendered, no hooks. The h1 is plain text with no entrance, so it is
 * the largest paint and the page's LCP; only the bar behind its last line, the
 * cube and the labels move, once, at first paint (hero.module.css).
 *
 * The labels and the cube share one box (the stage, 58 units wide), so the
 * labels are placed with the same maths as the SVG and stay glued to it at any
 * width. 1280 and up: leader lines and bone labels. Below that, a numbered key
 * under the buttons and numbered discs on the cube.
 *
 * Every label is a link to the promise it names further down ("What you get"),
 * and pointing at it or tabbing to it lights its part of the cube.
 *
 * Below 1024 the cube steps back to a small brand mark, and the room it leaves
 * goes to a phone-sized still of Penner & Daughters beside the key, linking to
 * its card in the examples. The wrappers that hold them (.foot, .side) are
 * display:contents from 1024 up, so the desktop poster is exactly as it was.
 */

// The cube's frame in page units (a unit is 1% of the hero's width): 58 wide,
// its left edge at 54.5, its top at 9. Keep in step with .stage in the CSS.
const FRAME = { width: 58, left: 54.5, top: 9 };

// The Penner phone still, as in the examples (src/assets/work). Widths from the manifest: Turbopack calls every AVIF 100px wide.
const PEEK = SHOTS.penner.phone;
const srcSet = (files: readonly PosterFile[]) => files.map(({ file, width }) => `${file.src} ${width}w`).join(", ");
const PEEK_SIZES = "(min-width: 640px) 300px, 42vw";
// A 1x1 transparent GIF: what the still loads at 1024 and up, where it is hidden.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const LABELS: Record<CubePart, ReactNode> = {
  top: (
    <>
      Loads fast on
      <br className={s.dbr} /> a weak signal
    </>
  ),
  left: "Made from scratch",
  right: (
    <>
      Set up so people
      <br className={s.dbr} /> nearby can find you
    </>
  ),
  brace: "We can look after it",
};

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <Section id="top" surface="ember" className={s.hero}>
      <div className={s.frame}>
        <div className={s.copy}>
          {/*
            The three lines are plain text broken with <br>, not block spans: a
            browser measures LCP per block of text, so the whole headline stays
            one block, and the LCP, on a phone where one line alone is smaller
            than the lead below it.
          */}
          <h1 className={`t-display ${s.h1}`}>
            Beautiful websites <br />
            for beautiful <br />
            businesses.{" "}
            <span className={s.promise}>
              <span className={s.promiseText}>
                <span>Try yours</span> <span>before you pay.</span>
              </span>
            </span>
          </h1>

          <p className={`t-lead ${s.lead}`}>
            We’re a small studio. We build your new site from what’s already online about you, and you decide if it’s
            worth paying for.
          </p>

          <div className={s.cta}>
            <Button onClick={onStart}>Ask for a preview</Button>
            <TextLink href="#work">
              See examples
              <ArrowDown />
            </TextLink>
          </div>

          {/* Phones and tablets: the key and the Penner still side by side, the small cube above the still. */}
          <div className={s.foot}>
            <ol role="list" aria-label="What you get" className={s.tags}>
              {HERO_CALLOUTS.map(({ part, align, anchor }, i) => {
                const { x, y } = cubePoint(anchor, FRAME);
                return (
                  <li
                    key={part}
                    className={s.tag}
                    data-part={part}
                    data-align={align}
                    style={{ "--lx": x - 100, "--ly": y, "--i": i } as CSSProperties}
                  >
                    {/* Each label is the promise's own heading, so it jumps to it (care.tsx, #promise-N). */}
                    <a href={`#promise-${i + 1}`} className={s.card}>
                      <b className={s.n} aria-hidden>
                        {i + 1}
                      </b>
                      <span className={s.t}>{LABELS[part]}</span>
                    </a>
                  </li>
                );
              })}
            </ol>

            <div className={s.side}>
              {/* From 1024 up the link is display:none, and the first source hands it a blank pixel, so the still is never fetched there. */}
              <a href="#work-penner" className={s.peek}>
                <span className={s.peekShot}>
                  <picture>
                    <source media="(min-width: 1024px)" srcSet={BLANK} />
                    <source type="image/avif" srcSet={srcSet(PEEK.avif)} sizes={PEEK_SIZES} />
                    <img
                      src={PEEK.webp[0].file.src}
                      srcSet={srcSet(PEEK.webp)}
                      sizes={PEEK_SIZES}
                      width={PEEK.webp[0].width}
                      height={PEEK.webp[0].height}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </span>
                <span className={s.peekText}>
                  <span className={s.peekSector}>Auto repair</span>
                  <span className={s.peekTitle}>
                    Penner &amp;{" "}
                    <span>
                      Daughters
                      <ArrowDown />
                    </span>
                  </span>
                </span>
              </a>
              <div className={`${s.stage} ld-slide`} style={{ "--rv-t": "700ms" } as CSSProperties}>
                <HeroCube />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
