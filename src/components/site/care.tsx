import type { CSSProperties } from "react";
import { PART_ORDER } from "@/lib/cube";
import { PartCube } from "./cube-art";
import { NumberSquare, Section, SectionHead } from "./kit";
import styles from "./care.module.css";

/**
 * "What you get" on bone: the four promises as a ruled 2x2 sheet (one column
 * on phones). Each cell shows the logo cube with the one part it is about lit
 * in ember, and the same number square the hero's callouts carry: 1 top face,
 * 2 left face, 3 right face, 4 brace (PART_ORDER, from lib/cube).
 *
 * Motion: opacity and scale only, once, as each cell scrolls in. The text
 * rises, the drawing fades up and its ember part follows a beat later (see
 * care.module.css), and the number square settles from .85 to 1. Reduced
 * motion and no-JS: everything is just there.
 */

const PILLARS: readonly { title: string; body: string }[] = [
  {
    title: "Loads fast on a weak signal",
    body:
      "Chances are most people find you on their phone, often on cell data. We keep pages light and size every photo to fit the screen. This page does it too.",
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

export function Care() {
  return (
    <Section id="care" surface="bone" className="px-g pt-[88px] max-sm:pt-14">
      <SectionHead title="What you get">Most of it comes down to getting your phone to ring.</SectionHead>

      {/* role=list: Safari drops list semantics from a list with list-style none. */}
      <ol role="list" className={styles.grid}>
        {PILLARS.map((pillar, i) => (
          <li
            key={pillar.title}
            data-reveal
            style={{ "--d": i % 2 ? "80ms" : "0ms" } as CSSProperties}
            className={styles.cell}
          >
            <PartCube part={PART_ORDER[i]} className={`rv-fade ${styles.art}`} />
            <div className="rv-rise">
              <h3 className="t-h3-lg flex max-w-[14em] items-start gap-3.5 text-wrap max-sm:flex-col max-sm:gap-2.5">
                {/* The wrapper takes the pop: .num carries its own transform. */}
                <span className="rv-pop flex">
                  <NumberSquare n={i + 1} className="max-sm:size-7 max-sm:text-[17px]" />
                </span>
                <span>{pillar.title}</span>
              </h3>
              <p className="mt-3.5 max-w-[33em]">{pillar.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
