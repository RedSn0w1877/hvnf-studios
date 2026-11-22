import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { PosterFile, Shot } from "@/assets/work";
import { STEPS, type Spot, type Step } from "./demos";
import s from "./portfolio.module.css";

/**
 * One bento: the logo box, the long nav box, the round pill, the headline box
 * and the picture box, all one colour, packed with 6px gutters.
 *
 * It is drawn once per page as the scroll stage (every step's content inside,
 * one showing at a time) and, for visitors without JavaScript, once per step
 * as a plain stacked list (`steps` holds that one step only).
 *
 * The boxes themselves are "plates": flat coloured shapes laid under the
 * content. The step's numbers go on the root as CSS custom properties (colours,
 * the headline box's share of the width, where each sticker and the device
 * sit). Change the step and every plate, sticker, the device, the cursor and
 * the asterisk retarget from wherever they are, on CSS transitions with a
 * spring curve (portfolio.module.css, --spring). Only transform, opacity,
 * filter and colours move.
 */

type Props = {
  steps: readonly Step[];
  /** Index into `steps` of the one showing. */
  active: number;
  /** Indexes whose pictures may load now (the rest wait until the visitor gets near). */
  loaded: (index: number) => boolean;
  /** The first picture on the page: fetched eagerly, at high priority. */
  priority?: boolean;
  /** The h1 lives in exactly one bento on the page. */
  headingLevel: "h1" | "p";
  /** The round pill at the top right. */
  next: ReactNode;
  /** The small step dots in the nav box (stage only). */
  dots?: ReactNode;
  className?: string;
  id?: string;
  /** On the homepage the demo names are h3 (under its own h2); on /portfolio they are h2. */
  embedded?: boolean;
};

const srcSet = (files: readonly PosterFile[]) => files.map(({ file, width }) => `${file.src} ${width}w`).join(", ");

const PHONE = "(max-width: 767px)";

const spot = (prefix: string, p: Spot) => ({
  [`--${prefix}x`]: p.x,
  [`--${prefix}y`]: p.y,
  [`--${prefix}r`]: `${p.r}deg`,
});

/** The active step's numbers, as custom properties on the bento's root. */
function stepVars(step: Step): CSSProperties {
  const { palette: c, layout: l } = step;
  return {
    "--ground": c.ground,
    "--box": c.box,
    "--ink": c.ink,
    "--pill-bg": c.pillBg,
    "--pill-fg": c.pillFg,
    "--s1-bg": c.s1[0],
    "--s1-fg": c.s1[1],
    "--s1-ring": c.s1[2],
    "--s2-bg": c.s2[0],
    "--s2-fg": c.s2[1],
    "--s2-ring": c.s2[2],
    "--s3-bg": c.s3[0],
    "--s3-fg": c.s3[1],
    "--s3-ring": c.s3[2],
    "--bezel": c.bezel,
    "--split": l.split,
    ...spot("d", l.device),
    ...spot("o", l.orbit),
    ...spot("a", l.stickers[0]),
    ...spot("b", l.stickers[1]),
    ...spot("c", l.stickers[2]),
    ...spot("k", l.cursor),
    ...spot("t", l.star),
  } as CSSProperties;
}

const stateOf = (i: number, active: number) => (i < active ? "before" : i > active ? "after" : "on");

/** The demo's first screen: the phone poster under 768px, the desktop one above. */
function Screen({ shot, load, priority }: { shot: Shot; load: boolean; priority: boolean }) {
  const { desktop, phone } = shot;
  const fallback = desktop.webp[desktop.webp.length - 1];
  const sizes = "(min-width: 768px) 38vw, 70vw";
  if (!load) return <span className={s.shotEmpty} />;
  return (
    <picture>
      <source media={PHONE} type="image/avif" srcSet={srcSet(phone.avif)} sizes="70vw" />
      <source media={PHONE} type="image/webp" srcSet={srcSet(phone.webp)} sizes="70vw" />
      <source type="image/avif" srcSet={srcSet(desktop.avif)} sizes={sizes} />
      <img
        src={fallback.file.src}
        srcSet={srcSet(desktop.webp)}
        sizes={sizes}
        width={fallback.width}
        height={fallback.height}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={s.shotImg}
      />
    </picture>
  );
}

/** The four demos' phone screens fanned out, for HVNF's own closing step. */
function Fan({ load }: { load: boolean }) {
  const demos = STEPS.filter((step) => step.shot);
  return (
    <div className={s.fan}>
      {demos.map((step, i) => {
        const phone = step.shot!.phone;
        const file = phone.webp[0];
        return (
          <span key={step.id} className={s.fanPhone} style={{ "--f": i - 1.5 } as CSSProperties}>
            {load ? (
              <picture>
                <source type="image/avif" srcSet={srcSet(phone.avif)} sizes="20vw" />
                <img
                  src={file.file.src}
                  width={file.width}
                  height={file.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={s.shotImg}
                />
              </picture>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden focusable="false">
      <path d="M1 8h29M23 1l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cursor() {
  return (
    <svg viewBox="0 0 40 48" aria-hidden focusable="false">
      <path
        d="M3 3l32 17-14 3.5L29 41l-6.5 3.5-8-17.5L4 37z"
        fill="#FFFFFF"
        stroke="#121212"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden focusable="false">
      <path d="M12 1.5v21M1.5 12h21M4.6 4.6l14.8 14.8M19.4 4.6L4.6 19.4" />
    </svg>
  );
}

export function Bento({ steps, active, loaded, priority = false, headingLevel, next, dots, className, id, embedded = false }: Props) {
  const step = steps[active];
  const Heading = headingLevel;
  const Name = embedded ? "h3" : "h2";
  const closing = step.shot === null;

  return (
    <div id={id} className={`${s.bento} ${className ?? ""}`} style={stepVars(step)} data-closing={closing ? "" : undefined}>
      {/* The plates: the boxes' colour and shape, under everything. */}
      <span className={`${s.plate} ${s.plateLogo}`} aria-hidden />
      <span className={`${s.plate} ${s.plateNav}`} aria-hidden />
      <span className={`${s.plate} ${s.platePill}`} aria-hidden />
      <span className={`${s.plate} ${s.plateLeft}`} aria-hidden />
      <span className={`${s.plate} ${s.plateRight}`} aria-hidden />

      {/* Top row */}
      <Link href="/" className={s.logo} aria-label="HVNF Studios, back to the homepage">
        <span>HVNF</span>
        <span>Studios</span>
      </Link>

      <div className={s.nav}>
        <div className={s.navTitle}>
          <Heading className={s.title}>Four sites we’ve made</Heading>
          <p className={s.titleNote}>Made-up brands, real working sites.</p>
        </div>
        {dots}
        <nav aria-label="Homepage" className={s.navLinks}>
          <Link href="/#work" className={s.navLink}>
            Examples
          </Link>
          <Link href="/#method" className={s.navLink}>
            How it works
          </Link>
        </nav>
      </div>

      <div className={s.pillSlot}>{next}</div>

      {/* The headline box: one layer per step, the active one showing. */}
      {steps.map((item, i) => {
        const state = stateOf(i, active);
        const hidden = state !== "on";
        return (
          <article
            key={item.id}
            className={s.layer}
            data-state={state}
            aria-hidden={hidden || undefined}
            inert={hidden}
            style={{ "--ls": item.layout.split } as CSSProperties}
          >
            <header className={s.layerHead}>
              <Name className={s.name}>{item.title}</Name>
              <span className={s.sector}>{item.sector}</span>
            </header>
            <p className={s.headline}>{item.headline}</p>
            <p className={s.blurb}>{item.blurb}</p>
            {item.external ? (
              <a href={item.href} target="_blank" rel="noreferrer" className={s.cta}>
                <span>{item.cta}</span>
                <span className={s.srOnly}> (opens in a new tab)</span>
                <Arrow className={s.ctaArrow} />
              </a>
            ) : (
              <Link href={item.href} className={s.cta}>
                <span>{item.cta}</span>
                <Arrow className={s.ctaArrow} />
              </Link>
            )}
          </article>
        );
      })}

      {/* The picture box: shared parts that move between steps. */}
      <span className={`${s.part} ${s.orbit}`} aria-hidden />

      <a
        href={step.shot ? step.href : undefined}
        target="_blank"
        rel="noreferrer"
        tabIndex={-1}
        aria-hidden
        className={`${s.part} ${s.device}`}
      >
        <span className={s.frame}>
          <span className={s.bar}>
            <i />
            <i />
            <i />
            <span className={s.url}>© HVNF Studios · do not redistribute</span>
          </span>
          <span className={s.screen}>
            {steps.map((item, i) =>
              item.shot ? (
                <span key={item.id} className={s.shot} data-state={stateOf(i, active)}>
                  <Screen shot={item.shot} load={loaded(i)} priority={priority && i === 0} />
                </span>
              ) : null,
            )}
          </span>
        </span>
      </a>

      {closing || steps.some((item) => !item.shot) ? (
        <span className={s.fanSlot} data-on={closing ? "" : undefined} aria-hidden>
          <Fan load={steps.some((item, i) => !item.shot && loaded(i))} />
        </span>
      ) : null}

      {(["a", "b", "c"] as const).map((key, n) => (
        <span key={key} className={`${s.part} ${s.sticker}`} data-sticker={key} aria-hidden>
          {steps.map((item, i) => (
            <span key={item.id} className={s.stickerText} data-state={stateOf(i, active)}>
              {item.stickers[n].text}
            </span>
          ))}
        </span>
      ))}

      {/* The same facts, readable: the stickers are drawn for the eye only. */}
      <ul className={s.srOnly}>
        {step.stickers.map((sticker) => (
          <li key={sticker.text}>{sticker.text}</li>
        ))}
      </ul>

      <span className={`${s.part} ${s.cursor}`} aria-hidden>
        <Cursor />
      </span>
      <span className={`${s.part} ${s.star}`} aria-hidden>
        <Star />
      </span>
    </div>
  );
}

export { Arrow };
