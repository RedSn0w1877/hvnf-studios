import type { CSSProperties } from "react";
import { StepCube, type StepState } from "./cube-art";
import { Section, SectionHead } from "./kit";
import s from "./method.module.css";

/**
 * How it works (full-bleed cobalt): the four steps as four states of one
 * drawing (draft, marked up, built, yours), with a heavy payment bar across
 * the top that says when money moves: nothing over steps 1 and 2, half over 3,
 * the other half over 4. On a phone each bar becomes a band directly above the
 * step or steps it covers.
 *
 * Server-rendered, no hooks. The bars are decoration for the eye (aria-hidden);
 * the same words sit inside the steps they cover for a screen reader, so the
 * money is read in the right place. Entrances are CSS driven by data-reveal
 * (see method.module.css and lib/in-view.ts).
 */

type Step = {
  key: string;
  state: StepState;
  label: string;
  title: string;
  body: string;
  /** Said aloud ahead of this step. Only the first step each bar covers has one. */
  pays?: string;
  /** When this step's drawing arrives, once the block scrolls in. */
  delay: string;
};

const STEPS: readonly Step[] = [
  {
    key: "s1",
    state: "draft",
    label: "Draft",
    title: "We build first, then talk",
    body:
      "You get a working preview of your new site before you pay anything, already filled in with your photos, reviews and services. Open it on your phone and press the call button.",
    pays: "You pay nothing",
    delay: "220ms",
  },
  {
    key: "s2",
    state: "changes",
    label: "Your changes",
    title: "You tell us what to change",
    body:
      "We’ll get a few things wrong, like an old photo or a service you don’t offer anymore. Send us a list and we’ll work through it with you until it sounds like your business.",
    delay: "300ms",
  },
  {
    key: "s3",
    state: "built",
    label: "Built",
    title: "We finish the job",
    body:
      "Once we’ve agreed on a written quote, you pay half and we finish the pages with your own words and photos. We check every page on a phone, and messages and bookings come straight to you.",
    pays: "You pay half",
    delay: "420ms",
  },
  {
    key: "s4",
    state: "yours",
    label: "Yours",
    title: "It goes live in your name",
    body:
      "You pay the other half right before the new site goes up at your web address. The address and the code are yours. While you’re on a care plan we host it for you, and if you ever leave, we hand it all over.",
    pays: "You pay the other half",
    delay: "580ms",
  },
];

const PAY: readonly { cls: string; text: string; delay: string }[] = [
  { cls: s.p0, text: "You pay nothing", delay: "0ms" },
  { cls: s.p1, text: "You pay half", delay: "200ms" },
  { cls: s.p2, text: "You pay the other half", delay: "400ms" },
];

export function Method() {
  return (
    <Section id="method" surface="cobalt" band className="px-g pt-[72px] max-sm:pt-14">
      <SectionHead title="How it works">
        {/* The no-break space keeps "walk away" whole, so a two-line wrap breaks at the comma. */}
        If you don’t like the preview, walk&nbsp;away. You won’t owe us anything.
      </SectionHead>

      <div className={s.flow} data-reveal>
        {PAY.map(({ cls, text, delay }) => (
          <p key={cls} className={`t-pay ${s.pay} ${cls}`} style={{ "--d": delay } as CSSProperties} aria-hidden>
            <span>{text}</span>
          </p>
        ))}

        {/* role=list: Safari drops list semantics from a list with list-style none or display:contents. */}
        <ol role="list" className={s.steps}>
          {STEPS.map((step, i) => (
            <li key={step.key} className={`${s.step} ${s[step.key]}`} style={{ "--d": step.delay } as CSSProperties}>
              <div className={s.top}>
                <span aria-hidden className="t-num">
                  {i + 1}
                </span>
                <span className={`t-label font-bold ${step.state === "changes" ? s.chip : s.label}`}>{step.label}</span>
              </div>
              <StepCube state={step.state} className={`${s.art} rv-up`} />
              {step.pays ? <p className="sr-only">{step.pays}.</p> : null}
              <h3 className="t-h3">{step.title}</h3>
              <p className="t-body">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
