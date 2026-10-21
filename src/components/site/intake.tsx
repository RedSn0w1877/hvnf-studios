"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type confetti from "canvas-confetti";
import { STUDIO_EMAIL } from "@/lib/studio";
import { CubeMark } from "./cube-mark";
import { IsoRhombus, Magnetic, SETTLE } from "./kit";

/**
 * Project intake.
 *
 * This site is a static export with no server, so the drawer does not pretend to
 * submit anywhere. It collects the brief, shows it back, and hands it to the
 * visitor's mail client addressed to the studio — a real path that works offline
 * of any backend, and never claims to have sent something it did not.
 *
 * It is dressed as a paper brief sheet: a document you fill in, so it sits on
 * the paper surface, and data-surface="paper" turns every focus ring ink. The
 * mark in the header draws one more stage of the cube per step and gets its
 * brace on the review.
 */

const KINDS = [
  { id: "new", label: "A new site", note: "Nothing there yet, or starting over" },
  { id: "replace", label: "Replace what we have", note: "It is slow, dated, or hard to change" },
  { id: "booking", label: "Take bookings or calls", note: "Turn visitors into actual appointments" },
  { id: "care", label: "Look after our site", note: "Hosting, updates and a monthly check" },
] as const;

const TIMING = [
  { id: "soon", label: "As soon as you can" },
  { id: "month", label: "Within a month or two" },
  { id: "looking", label: "Just weighing it up" },
] as const;

type Details = { name: string; business: string; email: string; current: string; notes: string };

const EMPTY: Details = { name: "", business: "", email: "", current: "", notes: "" };

/**
 * The sheet's Tab stops, in order, as the browser will actually visit them. A
 * radio group is ONE stop (its checked radio, or the first if none is), so the
 * trap's first and last are real stops: a group of four used to count its
 * fourth radio as "last", while Tab left the group from the first.
 */
function tabStops(root: HTMLElement) {
  const all = Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  );
  return all.filter((el) => {
    if (!(el instanceof HTMLInputElement) || el.type !== "radio" || !el.name) return true;
    const group = all.filter((other) => other instanceof HTMLInputElement && other.type === "radio" && other.name === el.name);
    const checked = group.find((radio) => (radio as HTMLInputElement).checked);
    return el === (checked ?? group[0]);
  });
}

function validate(details: Details) {
  const errors: Partial<Record<keyof Details, string>> = {};
  if (details.name.trim().length < 2) errors.name = "Please add your name.";
  if (details.business.trim().length < 2) errors.business = "Please add the business name.";
  // Deliberately loose: a strict pattern rejects real addresses more often than it saves anyone.
  if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) errors.email = "Please add an email we can reply to.";
  return errors;
}

export function Intake({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<string | null>(null);
  const [timing, setTiming] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [emailRequested, setEmailRequested] = useState(false);

  const panel = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const opener = useRef<Element | null>(null);
  // Set by Continue and Back, so only a real step change moves focus (not the
  // reset after closing, and not the first open, which focuses Close).
  const stepMoved = useRef(false);
  // Which way the last Tab went, for the focus guard below.
  const backwards = useRef(false);
  const reduce = useReducedMotion();
  const still = reduce === true;

  // Focus management: remember what opened the drawer, move focus in, keep it
  // in, put it back.
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const first = panel.current?.querySelector<HTMLElement>("button, input, textarea, a[href]");
    first?.focus();
    // The backstop for the Tab wrap: anything that still lands focus outside
    // the sheet (the browser leaving a radio group, a click on the backdrop)
    // is pulled straight back in, to the end it left from.
    const guard = (event: FocusEvent) => {
      const sheet = panel.current;
      if (!sheet || sheet.contains(event.target as Node)) return;
      const stops = tabStops(sheet);
      (backwards.current ? stops[stops.length - 1] : stops[0])?.focus();
    };
    document.addEventListener("focusin", guard);
    return () => {
      // Off before focus goes home, or the guard would pull it back in.
      document.removeEventListener("focusin", guard);
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // Escape closes; Tab stays inside the dialog; the page behind never scrolls.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      backwards.current = event.shiftKey;
      const sheet = panel.current;
      if (!sheet) return;
      const list = tabStops(sheet);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const at = document.activeElement;
      // Wrap at either end, and from wherever focus has strayed to (body,
      // after a focused button was disabled) back to the matching end.
      if (event.shiftKey && (at === first || !sheet.contains(at))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (at === last || !sheet.contains(at))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  // A step change disables or swaps out the button that was pressed, which
  // would drop focus to <body>. Catch it on the step line straight away (it
  // also announces "Step 2 of 4 — Timing"); enterStep below then hands it to
  // the new step's first control once that step has animated in.
  useEffect(() => {
    if (stepMoved.current) status.current?.focus();
  }, [step]);

  const enterStep = useCallback((node: HTMLDivElement | null) => {
    if (!node || !stepMoved.current) return;
    stepMoved.current = false;
    const sheet = panel.current;
    // Only if nobody has moved on since: a Tab during the 400ms swap wins.
    const at = document.activeElement;
    if (!sheet || (at !== status.current && at !== document.body && at !== null)) return;
    const target =
      node.querySelector<HTMLElement>("input[type=radio]:checked") ??
      node.querySelector<HTMLElement>("input, textarea") ??
      sheet.querySelector<HTMLElement>('a[href^="mailto:"]');
    target?.focus();
  }, []);

  const goTo = (next: number) => {
    stepMoved.current = true;
    setStep(next);
  };

  // Reset a beat after closing, so the drawer does not visibly rewind on the way out.
  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      stepMoved.current = false;
      setStep(0);
      setKind(null);
      setTiming(null);
      setDetails(EMPTY);
      setErrors({});
      setEmailRequested(false);
    }, 500);
    return () => window.clearTimeout(id);
  }, [open]);

  const mailto = useMemo(() => {
    const kindLabel = KINDS.find((k) => k.id === kind)?.label ?? "Not specified";
    const timingLabel = TIMING.find((t) => t.id === timing)?.label ?? "Not specified";
    const body = [
      `Business: ${details.business}`,
      `Name: ${details.name}`,
      `Email: ${details.email}`,
      details.current ? `Current site: ${details.current}` : null,
      "",
      `What they need: ${kindLabel}`,
      `Timing: ${timingLabel}`,
      "",
      details.notes ? `Notes:\n${details.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    return `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(`Project enquiry — ${details.business || "new"}`)}&body=${encodeURIComponent(body)}`;
  }, [kind, timing, details]);

  const canAdvance = step === 0 ? Boolean(kind) : step === 1 ? Boolean(timing) : true;

  const next = () => {
    if (!canAdvance) return;
    if (step === 2) {
      const found = validate(details);
      setErrors(found);
      if (Object.keys(found).length) return;
      goTo(3);
      return;
    }
    goTo(Math.min(3, step + 1));
  };

  const openEmail = (event: MouseEvent<HTMLElement>) => {
    setEmailRequested(true);
    // The draft opens from the link itself; the send-off only rides along.
    if (!still) celebrate(event.currentTarget).catch(() => {});
  };

  const stepLabel = ["What you need", "Timing", "About you", "Review"][step] ?? "";
  // step only ever moves through 0..3 (clamped in next and Back), which is
  // exactly the mark's build scale: contour, uprights, frame, brace.
  const build = step as 0 | 1 | 2 | 3;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="intake-title">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/70"
          />

          <motion.div
            ref={panel}
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.6, ease: SETTLE }}
            data-lenis-prevent
            data-surface="paper"
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto border-l border-rule-paper bg-paper text-paper-ink"
          >
            <div className="flex items-center justify-between gap-4 border-b border-rule-paper px-6 py-5 md:px-8">
              <div className="min-w-0">
                <h2 id="intake-title" className="font-display text-[20px] font-semibold leading-tight">
                  Start a project
                </h2>
                {/* tabIndex -1: focus parks here between steps (see the step effect). */}
                <p ref={status} tabIndex={-1} className="mt-1 text-[13px] text-paper-muted outline-none">
                  {emailRequested ? "Ready to send" : `Step ${step + 1} of 4 — ${stepLabel}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <CubeMark size={44} tone="paper" build={build} />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-rule-paper text-paper-muted hover:border-paper-ink/40 hover:text-paper-ink"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div aria-hidden className="flex gap-1 px-6 pt-4 md:px-8">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-[2px] flex-1 overflow-hidden bg-rule-paper">
                  <motion.span
                    className="block h-full origin-left bg-paper-ink"
                    initial={false}
                    animate={{ scaleX: i <= step ? 1 : 0 }}
                    transition={still ? { duration: 0 } : { duration: 0.5, ease: SETTLE }}
                  />
                </span>
              ))}
            </div>

            <div className="flex-1 px-6 py-8 md:px-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  ref={enterStep}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: SETTLE }}
                >
                  {step === 0 ? (
                    <fieldset>
                      <legend className="text-[15px] text-paper-muted">What do you need?</legend>
                      <div className="mt-5 flex flex-col gap-2">
                        {KINDS.map((option) => (
                          <Choice
                            key={option.id}
                            name="kind"
                            value={option.id}
                            label={option.label}
                            note={option.note}
                            checked={kind === option.id}
                            onSelect={() => setKind(option.id)}
                            still={still}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {step === 1 ? (
                    <fieldset>
                      <legend className="text-[15px] text-paper-muted">When would you like it live?</legend>
                      <div className="mt-5 flex flex-col gap-2">
                        {TIMING.map((option) => (
                          <Choice
                            key={option.id}
                            name="timing"
                            value={option.id}
                            label={option.label}
                            checked={timing === option.id}
                            onSelect={() => setTiming(option.id)}
                            still={still}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {step === 2 ? (
                    <div className="flex flex-col gap-6">
                      <Field
                        label="Your name"
                        value={details.name}
                        error={errors.name}
                        onChange={(v) => setDetails((d) => ({ ...d, name: v }))}
                      />
                      <Field
                        label="Business name"
                        value={details.business}
                        error={errors.business}
                        onChange={(v) => setDetails((d) => ({ ...d, business: v }))}
                      />
                      <Field
                        label="Email"
                        type="email"
                        value={details.email}
                        error={errors.email}
                        onChange={(v) => setDetails((d) => ({ ...d, email: v }))}
                      />
                      <Field
                        label="Current website (optional)"
                        value={details.current}
                        onChange={(v) => setDetails((d) => ({ ...d, current: v }))}
                      />
                      <label className="flex flex-col gap-1.5">
                        <span className={LABEL}>Anything else (optional)</span>
                        <textarea
                          rows={4}
                          value={details.notes}
                          onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
                          className={`${UNDERLINE} resize-none ${RULE_REST}`}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div>
                      <p className="text-[15px] leading-relaxed text-paper-muted">
                        Here is your brief. Open an email draft with it all filled in, then send it from your email
                        app. Nothing leaves this page until you send it.
                      </p>
                      <dl className="mt-6 divide-y divide-rule-paper border-y border-rule-paper">
                        {[
                          ["Business", details.business],
                          ["Name", details.name],
                          ["Email", details.email],
                          ["Needs", KINDS.find((k) => k.id === kind)?.label ?? "—"],
                          ["Timing", TIMING.find((t) => t.id === timing)?.label ?? "—"],
                          ["Current site", details.current || "—"],
                        ].map(([term, value]) => (
                          <div key={term} className="flex items-baseline gap-6 py-3">
                            <dt className="w-32 shrink-0 text-[13px] font-medium text-paper-muted">{term}</dt>
                            <dd className="min-w-0 break-words text-[15px] text-paper-ink">{value}</dd>
                          </div>
                        ))}
                      </dl>

                      {emailRequested ? (
                        <p className="mt-6 flex items-center gap-2 text-[15px] text-draft-ink" role="status">
                          <Check size={16} aria-hidden className="shrink-0" />
                          Your email app should be open. If it did not, write to {STUDIO_EMAIL}.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-rule-paper bg-paper px-6 py-5 md:px-8">
              <button
                type="button"
                onClick={() => goTo(Math.max(0, step - 1))}
                disabled={step === 0}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 text-[14px] font-medium text-paper-muted enabled:hover:text-paper-ink disabled:opacity-40"
              >
                <ArrowLeft size={14} aria-hidden />
                Back
              </button>

              {step < 3 ? (
                <Magnetic
                  tone="ink"
                  onClick={next}
                  disabled={!canAdvance}
                  className={canAdvance ? "" : "cursor-not-allowed opacity-40"}
                >
                  Continue
                  <ArrowRight size={14} aria-hidden />
                </Magnetic>
              ) : (
                <Magnetic tone="ink" href={mailto} onClick={openEmail}>
                  Open email draft
                  <ArrowRight size={14} aria-hidden />
                </Magnetic>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/*
 * A choice row. The native radio stays in the DOM (visually hidden, still in
 * the tab order, still driven by arrow keys), and the row draws its own box.
 *
 * Selecting a row lays an ink block in from the left (450ms, settle) and drops
 * an ember rhombus into the box; deselecting lifts the block off with a quick
 * fade, then snaps its width back to zero out of sight. Transform and opacity
 * only. The text flips to bone as the ink arrives under it and back once the
 * ink has mostly gone: a single delayed change each way, never a colour tween.
 */
type RowFx = Record<"fill" | "mark" | "ink", CSSProperties | undefined>;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ROW_IN: RowFx = {
  fill: { transition: `transform 450ms ${EASE}` },
  mark: { transition: "opacity 200ms linear 150ms" },
  ink: { transition: "color 0s linear 90ms" },
};
const ROW_OUT: RowFx = {
  fill: { transition: "opacity 200ms linear, transform 0s linear 200ms" },
  mark: { transition: "opacity 120ms linear" },
  ink: { transition: "color 0s linear 100ms" },
};
// Reduced motion: every state change lands at once.
const NO_MOTION: RowFx = { fill: undefined, mark: undefined, ink: undefined };

function Choice({
  name,
  value,
  label,
  note,
  checked,
  onSelect,
  still,
}: {
  name: string;
  value: string;
  label: string;
  note?: string;
  checked: boolean;
  onSelect: () => void;
  still: boolean;
}) {
  const fx = still ? NO_MOTION : checked ? ROW_IN : ROW_OUT;
  return (
    <label className="relative flex cursor-pointer rounded-[2px] border border-rule-paper p-4 hover:border-paper-ink/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-paper-ink">
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={`absolute -inset-px origin-left rounded-[2px] bg-paper-ink ${checked ? "" : "[transform:scaleX(0)] opacity-0"}`}
        style={fx.fill}
      />
      <span
        className={`relative flex gap-4 ${note ? "items-start" : "items-center"} ${checked ? "text-bone" : "text-paper-ink"}`}
        style={fx.ink}
      >
        <span aria-hidden className={`relative h-3.5 w-3.5 shrink-0 border border-current ${note ? "mt-[3px]" : ""}`}>
          <span
            className={`absolute inset-0 flex items-center justify-center ${checked ? "" : "opacity-0"}`}
            style={fx.mark}
          >
            <IsoRhombus />
          </span>
        </span>
        <span>
          <span className="block text-[15px] font-medium">{label}</span>
          {note ? (
            <span className={`mt-1 block text-sm ${checked ? "text-ash" : "text-paper-muted"}`} style={fx.ink}>
              {note}
            </span>
          ) : null}
        </span>
      </span>
    </label>
  );
}

const LABEL = "text-[13px] font-medium text-paper-muted";

/*
 * Underline-only fields. At rest the 1.5px rule is half-strength ink: 3.3:1 on
 * paper, enough to read as a field (40% would be 2.5:1, under the 3:1 a control
 * boundary needs). Focus takes it to full ink and doubles it with a hard shadow
 * beneath (a static change, nothing animates), so the field you are in is
 * unmistakable without a box drawn round it. 16px text also keeps iOS from
 * zooming the page on focus.
 */
const UNDERLINE =
  "w-full rounded-none border-0 border-b-[1.5px] bg-transparent px-0 py-2 text-[16px] text-paper-ink outline-hidden focus:border-paper-ink focus:shadow-[0_1.5px_0_currentColor]";
const RULE_REST = "border-paper-ink/50";

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  const errorId = useId();
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${UNDERLINE} ${error ? "border-ember-ink" : RULE_REST}`}
      />
      {error ? (
        <span id={errorId} className="text-[13px] text-ember-ink">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/*
 * The send-off: one burst when the email draft opens. canvas-confetti is
 * fetched on that click and never before. It draws on its own temporary canvas,
 * in a worker where the browser allows, while the Stage sits paused behind the
 * drawer, and the canvas is gone 3s later.
 */

// The sheet's inks: paper-ink, ember, draft-ink, ember-ink.
const COLOURS = ["#14120f", "#e9a568", "#2f5f74", "#9a4512"];

// A beam and an iso rhombus (the cube's top face). Given no matrix,
// canvas-confetti fits a path itself by probing a 500×500 grid with
// isPointInPath: 60–70ms per shape in Chrome, a long task on the click. These
// matrices skip that: each path drawn at its own 12-unit size, centred on the
// origin. The library wants plain 6-number arrays (it checks Array.isArray
// before drawing a path, and an array crosses postMessage into the worker),
// although its types say DOMMatrix.
const PATHS = [
  { path: "M0 0h12v2H0z", matrix: [1, 0, 0, 1, -6, -1] },
  { path: "M0 3.46 6 0l6 3.46L6 6.93z", matrix: [1, 0, 0, 1, -6, -3.465] },
];

type Burst = { canvas: HTMLCanvasElement; fire: confetti.CreateTypes; timer: number };

let burst: Burst | null = null;
let shapes: confetti.Shape[] | null = null;
let workerFailed = false;

function endBurst() {
  if (!burst) return;
  window.clearTimeout(burst.timer);
  burst.fire.reset();
  burst.canvas.remove();
  burst = null;
}

function launch(lib: typeof confetti, options: confetti.Options, useWorker: boolean): Burst {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "pointer-events-none fixed inset-0 z-[75] h-full w-full";
  document.body.appendChild(canvas);
  try {
    const fire = lib.create(canvas, { resize: true, useWorker, disableForReducedMotion: true });
    const done = fire(options);
    const started: Burst = { canvas, fire, timer: window.setTimeout(endBurst, 3000) };
    if (useWorker) {
      // A shape the worker cannot take rejects here rather than throwing. Redo
      // the burst on the main thread, on a fresh canvas: this one now belongs
      // to the worker.
      done?.catch(() => {
        workerFailed = true;
        if (burst !== started) return;
        endBurst();
        burst = launch(lib, options, false);
      });
    }
    return started;
  } catch (error) {
    canvas.remove();
    throw error;
  }
}

async function celebrate(from: HTMLElement) {
  // The one layout read, taken before the await (currentTarget does not survive
  // it): the button's centre as a fraction of the viewport the canvas covers.
  const box = from.getBoundingClientRect();
  const origin = {
    x: (box.left + box.width / 2) / window.innerWidth,
    y: (box.top + box.height / 2) / window.innerHeight,
  };
  const lite = document.documentElement.hasAttribute("data-lite");

  let lib: typeof confetti;
  try {
    lib = (await import("canvas-confetti")).default;
  } catch {
    return; // Offline or blocked: the draft opens all the same.
  }

  if (!shapes) {
    try {
      shapes = PATHS.map(({ path, matrix }) => lib.shapeFromPath({ path, matrix: matrix as unknown as DOMMatrix }));
    } catch {
      shapes = ["square"]; // No Path2D in this browser: plain squares.
    }
  }

  const options: confetti.Options = {
    particleCount: lite ? 40 : 70,
    spread: 75,
    startVelocity: 38,
    ticks: 170,
    gravity: 1.05,
    scalar: 1.1,
    origin,
    colors: COLOURS,
    shapes,
  };

  // A second click mid-burst joins the one already in the air.
  if (burst) {
    burst.fire(options);
    window.clearTimeout(burst.timer);
    burst.timer = window.setTimeout(endBurst, 3000);
    return;
  }

  try {
    burst = launch(lib, options, !workerFailed);
  } catch {
    if (workerFailed) return;
    workerFailed = true;
    burst = launch(lib, options, false);
  }
}
