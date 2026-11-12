"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type confetti from "canvas-confetti";
import { STUDIO_EMAIL } from "@/lib/studio";
import { SmallMark } from "./cube-art";
import { Button } from "./kit";

// The drawer's motion easing (the same curve as --ease-settle in globals.css).
const SETTLE = [0.22, 1, 0.36, 1] as const;
// The sheet's own curve (Ionic's drawer curve): quick off the mark, long soft landing.
const DRAWER = [0.32, 0.72, 0, 1] as const;

/*
 * Timing. The sheet takes 420ms in and 260ms out (out is always faster: the
 * visitor has already decided). A step change is 140ms out and 200ms in, so
 * Continue answers in a third of a second, not the 800ms the two 400ms halves
 * used to take. Every move is a transform string, not motion's x shorthand:
 * motion 13 runs x on the main thread, while a transform runs on the
 * compositor and stays smooth while the page is busy (the drawer's code has
 * often only just loaded when it first opens).
 */
const SHEET_IN = { duration: 0.42, ease: DRAWER };
const SHEET_OUT = { duration: 0.26, ease: DRAWER };
const STEP_IN = { duration: 0.2, ease: SETTLE };
const STEP_OUT = { duration: 0.14, ease: SETTLE };

/**
 * Project intake.
 *
 * This site is a static export with no server, so the drawer does not pretend to
 * submit anywhere. It collects the brief, shows it back, and hands it to the
 * visitor's mail client addressed to the studio — a real path that works offline
 * of any backend, and never claims to have sent something it did not.
 *
 * It is dressed as a printed brief sheet in the Ember Drawing system: an ember
 * header with the cube mark, a bone sheet you fill in, square ink buttons and
 * boxed fields. data-surface="bone" turns every focus ring ink; the header sets
 * its own. Every colour pair is one of the verified ones (ink on bone, ink on
 * ember, bone on ink). Only transform and opacity ever move.
 */

const KINDS = [
  { id: "new", label: "A new site", note: "Nothing there yet, or starting over" },
  { id: "replace", label: "Replace what we have", note: "It’s slow or a pain to update" },
  { id: "booking", label: "Take bookings or calls", note: "Online booking, or an easy way for people to call" },
  { id: "care", label: "Look after our site", note: "We host it and make small changes for you" },
] as const;

const TIMING = [
  { id: "soon", label: "As soon as you can" },
  { id: "month", label: "Within a month or two" },
  { id: "looking", label: "Just looking for now" },
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
  if (details.business.trim().length < 2) errors.business = "Please add your business name.";
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
  // also announces "Step 2 of 4"); enterStep below then hands it to the new
  // step's first control once that step has animated in.
  useEffect(() => {
    if (stepMoved.current) status.current?.focus();
  }, [step]);

  const enterStep = useCallback((node: HTMLDivElement | null) => {
    if (!node || !stepMoved.current) return;
    stepMoved.current = false;
    const sheet = panel.current;
    // Only if nobody has moved on since: a Tab during the step swap wins.
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
    // Written in the visitor's voice: they send it from their own account, and
    // "What we need: Replace what we have" reads right from their side.
    const body = [
      `Business: ${details.business}`,
      `Name: ${details.name}`,
      `Email: ${details.email}`,
      details.current ? `Current site: ${details.current}` : null,
      "",
      `What we need: ${kindLabel}`,
      `Timing: ${timingLabel}`,
      "",
      details.notes ? `Notes:\n${details.notes}` : null,
    ]
      // Drop the empty optional lines (null) but keep the "" paragraph breaks.
      .filter((line) => line !== null)
      .join("\n")
      .trimEnd();
    const subject = `Website for ${details.business.trim() || "my business"}`;
    return `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [kind, timing, details]);

  const canAdvance = step === 0 ? Boolean(kind) : step === 1 ? Boolean(timing) : true;

  const next = () => {
    if (!canAdvance) return;
    if (step === 2) {
      const found = validate(details);
      setErrors(found);
      if (Object.keys(found).length) {
        // Nothing else would tell a screen reader the step didn't move. The
        // first field to fix reads out its label, that it's invalid, and the
        // error under it. A frame later, once the errors are on the page.
        requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
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

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="intake-title">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeOut" } }}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/70"
          />

          <motion.div
            ref={panel}
            initial={reduce ? { opacity: 0 } : { transform: "translateX(100%)" }}
            animate={reduce ? { opacity: 1, transition: { duration: 0.2 } } : { transform: "translateX(0%)", transition: SHEET_IN }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.15 } } : { transform: "translateX(100%)", transition: SHEET_OUT }}
            data-surface="bone"
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto border-l-8 border-ink"
          >
            <div
              data-surface="ember"
              className="flex items-center justify-between gap-4 border-b-8 border-ink px-6 py-5 md:px-8"
            >
              <div className="flex min-w-0 items-center gap-4">
                <SmallMark className="w-9 shrink-0" />
                <div className="min-w-0">
                  <h2 id="intake-title" className="t-h3">
                    Ask for a preview
                  </h2>
                  {/* tabIndex -1: focus parks here between steps (see the step effect). */}
                  <p ref={status} tabIndex={-1} className="t-small mt-1.5 outline-none">
                    {emailRequested ? "Ready to send" : `Step ${step + 1} of 4`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-bone"
              >
                <X size={20} strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            {/* Progress: four ink bars that fill in as the steps are done. */}
            <div aria-hidden className="flex gap-2 px-6 pt-6 md:px-8">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-[6px] flex-1 overflow-hidden bg-ink/20">
                  <motion.span
                    className="block h-full origin-left bg-ink"
                    initial={false}
                    animate={{ scaleX: i <= step ? 1 : 0 }}
                    transition={still ? { duration: 0 } : { duration: 0.3, ease: SETTLE }}
                  />
                </span>
              ))}
            </div>

            <div className="flex-1 px-6 py-8 md:px-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  ref={enterStep}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(16px)" }}
                  animate={reduce ? { opacity: 1, transition: STEP_IN } : { opacity: 1, transform: "translateX(0px)", transition: STEP_IN }}
                  exit={reduce ? { opacity: 0, transition: STEP_OUT } : { opacity: 0, transform: "translateX(-16px)", transition: STEP_OUT }}
                >
                  {step === 0 ? (
                    <fieldset>
                      <legend className="t-h3 w-full">What do you need?</legend>
                      <div className="mt-6 flex flex-col gap-3">
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
                      <legend className="t-h3 w-full">When do you need it?</legend>
                      <div className="mt-6 flex flex-col gap-3">
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
                        autoComplete="name"
                        value={details.name}
                        error={errors.name}
                        onChange={(v) => setDetails((d) => ({ ...d, name: v }))}
                      />
                      <Field
                        label="Business name"
                        autoComplete="organization"
                        value={details.business}
                        error={errors.business}
                        onChange={(v) => setDetails((d) => ({ ...d, business: v }))}
                      />
                      <Field
                        label="Email"
                        type="email"
                        autoComplete="email"
                        value={details.email}
                        error={errors.email}
                        onChange={(v) => setDetails((d) => ({ ...d, email: v }))}
                      />
                      <Field
                        label="Current website (optional)"
                        autoComplete="url"
                        value={details.current}
                        onChange={(v) => setDetails((d) => ({ ...d, current: v }))}
                      />
                      <label className="flex flex-col gap-2">
                        <span className={LABEL}>Anything else we should know? (optional)</span>
                        <textarea
                          rows={4}
                          value={details.notes}
                          onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
                          className={`${BOX} resize-none py-3 ${BOX_REST}`}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div>
                      <p className="t-body">
                        Here’s what you told us. The button below opens it as an email in your own email app, all
                        filled in. Nothing reaches us until you hit send.
                      </p>
                      <dl className="mt-6 divide-y divide-ink/25 border-y-2 border-ink">
                        {[
                          ["Business", details.business],
                          ["Name", details.name],
                          ["Email", details.email],
                          ["Looking for", KINDS.find((k) => k.id === kind)?.label ?? "—"],
                          ["Timing", TIMING.find((t) => t.id === timing)?.label ?? "—"],
                          ["Current site", details.current || "—"],
                        ].map(([term, value]) => (
                          <div key={term} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
                            <dt className="t-small shrink-0 text-ink/75 sm:w-32">{term}</dt>
                            <dd className="min-w-0 break-words text-[16px] font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>

                      {emailRequested ? (
                        <p
                          className="t-body mt-6 flex items-start gap-3 bg-ember p-4 font-medium text-ink"
                          role="status"
                        >
                          {/* Top-aligned to the first line: the message runs to three or four lines on a phone. */}
                          <Check size={18} strokeWidth={3} aria-hidden className="mt-[3px] shrink-0" />
                          <span>
                            Your email app should’ve opened. If it didn’t, email us at {STUDIO_EMAIL}. Once it’s sent,
                            one of us will write back.
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t-2 border-ink bg-bone px-6 py-4 md:px-8">
              <button
                type="button"
                onClick={() => {
                  // Going back to edit means the draft that opened is out of date:
                  // the step line and the review drop "Ready to send" until the
                  // new one is opened.
                  setEmailRequested(false);
                  goTo(Math.max(0, step - 1));
                }}
                disabled={step === 0}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 text-[16px] font-semibold underline decoration-2 underline-offset-6 enabled:hover:decoration-[3px] disabled:no-underline disabled:opacity-40"
              >
                <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
                Back
              </button>

              {step < 3 ? (
                <Button onClick={next} disabled={!canAdvance}>
                  Continue
                  <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
                </Button>
              ) : (
                <Button href={mailto} onClick={openEmail}>
                  Open email draft
                  <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
                </Button>
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
 * the tab order, still driven by arrow keys), and the row draws its own box: a
 * square with a 2px ink border.
 *
 * Selecting a row lays an ink block in from the left (280ms, settle) and drops
 * an ember square into the box; deselecting lifts the block off with a quick
 * fade, then snaps its width back to zero out of sight. Transform and opacity
 * only. The text flips to bone as the ink arrives under it and back once the
 * ink has mostly gone: a single delayed change each way, never a colour tween.
 */
type RowFx = Record<"fill" | "mark" | "ink", CSSProperties | undefined>;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ROW_IN: RowFx = {
  fill: { transition: `transform 280ms ${EASE}` },
  mark: { transition: "opacity 160ms linear 100ms" },
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
    <label className="relative flex min-h-14 cursor-pointer border-2 border-ink p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink">
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={`absolute -inset-[2px] origin-left bg-ink ${checked ? "" : "[transform:scaleX(0)] opacity-0"}`}
        style={fx.fill}
      />
      <span
        className={`relative flex gap-4 ${note ? "items-start" : "items-center"} ${checked ? "text-bone" : "text-ink"}`}
        style={fx.ink}
      >
        <span aria-hidden className={`relative grid h-5 w-5 shrink-0 place-items-center border-2 border-current ${note ? "mt-px" : ""}`}>
          <span className={`block h-2 w-2 bg-ember ${checked ? "" : "opacity-0"}`} style={fx.mark} />
        </span>
        <span>
          <span className="block text-[16px] font-semibold">{label}</span>
          {/* text-pretty: a span misses the base p rule, and two notes left "you" and "call" alone on a phone. */}
          {note ? (
            <span className={`mt-1 block text-pretty text-[14px] ${checked ? "text-bone-dim" : "text-ink/75"}`} style={fx.ink}>
              {note}
            </span>
          ) : null}
        </span>
      </span>
    </label>
  );
}

const LABEL = "text-[14px] font-semibold";

/*
 * Boxed fields: white inside a 2px ink border, 52px tall, square. White on bone
 * reads as a field you can write in, and the ink border is 15.6:1, far past the
 * 3:1 a control boundary needs. Focus draws the page's 3px ink ring (the global
 * :focus-visible rule), so nothing here sets an outline. An error thickens the
 * border with an inset ember frame (graphics only, never text) and the message
 * under it is ink on an ember block (4.95:1). 16px text also keeps iOS from
 * zooming the page on focus.
 */
const BOX = "w-full min-h-[52px] rounded-none border-2 bg-white px-3.5 text-[16px] text-ink";
const BOX_REST = "border-ink";
const BOX_ERROR = "border-ink shadow-[inset_0_0_0_3px_var(--color-ember)]";

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  /** The browser's autofill token (name, organization, email, url). */
  autoComplete?: string;
}) {
  const errorId = useId();
  // The error sits outside the <label>, so it is the field's description only.
  // Inside, it became part of the name too, and was read out twice.
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className={LABEL}>{label}</span>
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${BOX} ${error ? BOX_ERROR : BOX_REST}`}
        />
      </label>
      {error ? (
        <span id={errorId} className="t-small self-start bg-ember px-2.5 py-1 font-semibold text-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/*
 * The send-off: one burst when the email draft opens. canvas-confetti is
 * fetched on that click and never before. It draws on its own temporary canvas,
 * in a worker where the browser allows, behind the
 * drawer, and the canvas is gone 3s later.
 */

// The poster's inks: ink, ember, bone, cobalt.
const COLOURS = ["#15120f", "#ef4623", "#f1eadb", "#1747d4"];

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
