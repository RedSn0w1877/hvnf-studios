import type { CSSProperties, ReactNode } from "react";
import { HERO_CALLOUTS, HeroCube, cubePoint, type CubePart } from "./cube-art";
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
 */

// The cube's frame in page units (a unit is 1% of the hero's width): 58 wide,
// its left edge at 54.5, its top at 9. Keep in step with .stage in the CSS.
const FRAME = { width: 58, left: 54.5, top: 9 };

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
        </div>

        <div className={`${s.stage} ld-slide`} style={{ "--rv-t": "700ms" } as CSSProperties}>
          <HeroCube />
        </div>
      </div>
    </Section>
  );
}
