"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, animate, motion, useIsPresent, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { STUDIO_EMAIL } from "@/lib/studio";
import { requestSections, requestText } from "@/lib/request-format";
import { ACTIONS, BUSINESS_KINDS, NEEDS, TIMINGS, requestFields, type RequestDetails, type RequestField } from "@/lib/validations";
import { SmallMark } from "./cube-art";
import { ChoiceGroup, Field, SelectField, TextArea } from "./intake-fields";
import s from "./intake.module.css";

/**
 * "Ask for a preview": a card that rises into the middle of the screen (a
 * bottom card on phones), asks a few short questions a step at a time, and
 * emails the answers to the studio through POST /api/request.
 *
 * The motion is physical rather than timed, after Apple's sheets:
 *  - The card is a spring on one motion value (y). It rises on a spring with a
 *    small overshoot, follows a finger or mouse 1:1 while dragged, rubber-bands
 *    when pulled up past its resting place, and on release either flicks away
 *    (a fast release, or past 35% of its height) or springs back carrying the
 *    release velocity. Anything can interrupt it: a spring keeps its velocity.
 *  - A step change slides the old step out to the left and the new one in from
 *    the right (back reverses it) on a spring, while the card's body animates
 *    to the new step's height, so nothing jumps. That height is the one
 *    layout property animated here, on purpose: the alternative is a jump.
 *  - Reduced motion: no springs, no slides: a short fade, heights change at once.
 *
 * Progress lives in memory only (this component's state). Nothing is written
 * to localStorage or the URL, and closing the card by accident keeps the answers
 * until the page is left or a request is sent.
 *
 * The Pages mirror has no server, so there the last step falls back to a mailto:
 * link, as it always did (NEXT_PUBLIC_REQUEST_API is only set in server builds).
 */

const HAS_API = process.env.NEXT_PUBLIC_REQUEST_API === "1";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Springs. The card: a touch under critical damping, so it lands with a hair of overshoot.
const CARD_SPRING = { type: "spring", stiffness: 320, damping: 27, mass: 1 } as const;
// On a phone the card sits on the screen's bottom edge: any overshoot would open a gap under it, so it lands without one.
const CARD_SPRING_PHONE = { type: "spring", stiffness: 320, damping: 36, mass: 1 } as const;
const STEP_SPRING = { type: "spring", stiffness: 420, damping: 38, mass: 1 } as const;
const HEIGHT_SPRING = { type: "spring", stiffness: 380, damping: 36, mass: 1 } as const;
const BACK_SPRING = { type: "spring", stiffness: 520, damping: 38, mass: 1 } as const;
const OUT = [0.23, 1, 0.32, 1] as const;
const DRAWER = [0.32, 0.72, 0, 1] as const;

// Gesture tuning.
const DRAG_START_PX = 6;
const DISMISS_FRACTION = 0.35;
const DISMISS_VELOCITY = 0.5; // px per ms: a quick flick
const RUBBER_REACH = 140;

/** iOS-style rubber band: the further past the edge, the less each pixel moves. */
const rubber = (distance: number) => (1 - 1 / ((distance * 0.55) / RUBBER_REACH + 1)) * RUBBER_REACH;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const isPhone = () => window.matchMedia("(max-width: 639px)").matches;

type Draft = Record<Exclude<RequestField, "actions">, string> & { actions: string[] };

const EMPTY: Draft = {
  name: "",
  email: "",
  phone: "",
  business: "",
  businessKind: "",
  town: "",
  current: "",
  need: "",
  timing: "",
  problem: "",
  actions: [],
  links: "",
  brand: "",
  hours: "",
  services: "",
  extra: "",
};

type Step = { id: string; name: string; fields: RequestField[] };

const STEPS: Step[] = [
  { id: "you", name: "About you", fields: ["name", "email", "phone"] },
  { id: "business", name: "Your business", fields: ["business", "businessKind", "town", "current"] },
  { id: "need", name: "Your project", fields: ["need", "timing"] },
  { id: "goal", name: "Your site", fields: ["problem", "actions", "links"] },
  { id: "extra", name: "Make it better", fields: ["brand", "hours", "services", "extra"] },
  { id: "review", name: "Check and send", fields: [] },
];
const REVIEW = STEPS.length - 1;
// Which step each review section's "Edit" goes back to.
const SECTION_STEP: Record<string, number> = { Contact: 0, Business: 1, "What they need": 2, "For the preview": 4 };

type Errors = Partial<Record<RequestField, string>>;
type Phase = "form" | "sent" | "fallback";

function checkFields(draft: Draft, fields: RequestField[]): Errors {
  const found: Errors = {};
  for (const field of fields) {
    const result = requestFields[field].safeParse(draft[field]);
    if (!result.success) found[field] = result.error.issues[0]?.message ?? "Please check this.";
  }
  return found;
}

/**
 * The card's Tab stops, in order, as the browser will actually visit them. A
 * radio group is ONE stop (its checked radio, or the first if none is), so the
 * trap's first and last are real stops.
 */
function tabStops(root: HTMLElement) {
  const all = Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.closest("[inert]") && el.tabIndex >= 0);
  return all.filter((el) => {
    if (!(el instanceof HTMLInputElement) || el.type !== "radio" || !el.name) return true;
    const group = all.filter((other) => other instanceof HTMLInputElement && other.type === "radio" && other.name === el.name);
    const checked = group.find((radio) => (radio as HTMLInputElement).checked);
    return el === (checked ?? group[0]);
  });
}

/* ── One step's content, sliding in and out ─────────────────────────────── */

const SLIDE = {
  enter: (d: number) => ({ x: d > 0 ? "55%" : "-55%", opacity: 0 }),
  center: { x: "0%", opacity: 1, transition: { x: STEP_SPRING, opacity: { duration: 0.2, ease: OUT } } },
  exit: (d: number) => ({ x: d > 0 ? "-55%" : "55%", opacity: 0, transition: { x: STEP_SPRING, opacity: { duration: 0.14, ease: OUT } } }),
};
const FADE = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.15, ease: OUT } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: OUT } },
};

function Slide({
  children,
  custom,
  still,
  onHeight,
  onEnter,
}: {
  children: ReactNode;
  custom: number;
  still: boolean;
  onHeight: (h: number) => void;
  onEnter: (node: HTMLElement) => void;
}) {
  const present = useIsPresent();
  const node = useRef<HTMLDivElement>(null);
  const reportHeight = useRef(onHeight);
  reportHeight.current = onHeight;
  const entered = useRef(onEnter);
  entered.current = onEnter;

  // The step reports its own height (and again whenever it changes, as an error
  // line appears), so the card's body can ease to it. Only the step on screen
  // reports: a step on its way out has stopped mattering.
  useLayoutEffect(() => {
    const el = node.current;
    if (!el || !present) return;
    reportHeight.current(el.offsetHeight);
    entered.current(el);
    const observer = new ResizeObserver(() => reportHeight.current(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [present]);

  return (
    <motion.div
      custom={custom}
      variants={still ? FADE : SLIDE}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-x-0 top-0 w-full"
    >
      <div ref={node} className="px-6 pb-7 pt-7 md:px-8">
        {children}
      </div>
    </motion.div>
  );
}

/* ── The card ───────────────────────────────────────────────────────────── */

export function Intake({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [present, setPresent] = useState(open);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("form");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [trap, setTrap] = useState("");
  const [draftOpened, setDraftOpened] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [fits, setFits] = useState(true);

  const reduce = useReducedMotion();
  const still = reduce === true;

  const card = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const opener = useRef<Element | null>(null);
  const stepMoved = useRef(false);
  const backwards = useRef(false);
  const lastPointer = useRef("mouse");
  const direction = useRef(1);
  const openedAt = useRef<number | null>(null);
  const heightKnown = useRef(false);
  const contentHeight = useRef(0);
  const shown = useRef(false);

  // One value moves the whole card; the backdrop and the fade follow it.
  const y = useMotionValue(0);
  const fade = useMotionValue(1);
  const heightValue = useMotionValue(0);
  const veil = useTransform([y, fade], ([top, f]: number[]) =>
    typeof window === "undefined" ? 1 : (1 - clamp(top / (window.innerHeight * 0.6), 0, 1)) * f,
  );
  const move = useRef<AnimationPlaybackControls | null>(null);
  const heightMove = useRef<AnimationPlaybackControls | null>(null);
  const fling = useRef(0);
  const exitToken = useRef(0);

  /* Opening and closing: spring in, spring out, from wherever the card is now. */
  useEffect(() => {
    if (open && !present) setPresent(true);
  }, [open, present]);

  useLayoutEffect(() => {
    if (!open || !present) return;
    exitToken.current++;
    move.current?.stop();
    if (still) {
      y.set(0);
      if (!shown.current) fade.set(0);
      shown.current = true;
      move.current = animate(fade, 1, { duration: 0.18, ease: OUT });
      return;
    }
    const phone = isPhone();
    const fresh = !shown.current;
    if (fresh) {
      // Fresh: below the screen on a phone, below centre (and fading in) on a desktop.
      y.set(phone ? window.innerHeight : window.innerHeight * 0.55);
      fade.set(phone ? 1 : 0);
      shown.current = true;
    }
    // A fresh start begins at rest (the jump above would otherwise read as a huge velocity).
    // Reopened mid-exit, it carries on from wherever it is, velocity and all.
    move.current = animate(y, 0, { ...(phone ? CARD_SPRING_PHONE : CARD_SPRING), ...(fresh ? { velocity: 0 } : {}) });
    animate(fade, 1, { duration: 0.16, ease: OUT });
  }, [open, present, still, y, fade]);

  useEffect(() => {
    if (open || !present) return;
    move.current?.stop();
    const done = () => {
      shown.current = false;
      heightKnown.current = false;
      setPresent(false);
    };
    // Only if it was not reopened while it flew out (the entrance bumps the token).
    const token = exitToken.current;
    const onComplete = () => {
      if (token === exitToken.current) done();
    };
    if (still) {
      move.current = animate(fade, 0, { duration: 0.14, ease: OUT, onComplete });
    } else {
      const velocity = fling.current;
      move.current = velocity
        ? animate(y, window.innerHeight, { type: "spring", stiffness: 260, damping: 34, velocity, onComplete })
        : animate(y, window.innerHeight, { duration: 0.26, ease: DRAWER, onComplete });
    }
    fling.current = 0;
  }, [open, present, still, y, fade]);

  // Once it is gone after a sent request, start fresh. Mid-form, the answers are kept.
  useEffect(() => {
    if (present || phase !== "sent") return;
    setStep(0);
    setPhase("form");
    setDraft(EMPTY);
    setErrors({});
    setFormError(null);
    setDraftOpened(false);
    setTrap("");
  }, [present, phase]);

  /* Focus: remember the trigger, move focus in, keep it in, put it back. */
  useEffect(() => {
    if (!open || !present) return;
    if (openedAt.current === null) openedAt.current = Date.now();
    opener.current = document.activeElement;
    card.current?.querySelector<HTMLElement>("button, input, textarea, select, a[href]")?.focus({ preventScroll: true });
    // The backstop for the Tab wrap: anything that still lands focus outside
    // the card is pulled straight back in, to the end it left from.
    const guard = (event: FocusEvent) => {
      const panel = card.current;
      if (!panel || panel.contains(event.target as Node)) return;
      const stops = tabStops(panel);
      (backwards.current ? stops[stops.length - 1] : stops[0])?.focus({ preventScroll: true });
    };
    document.addEventListener("focusin", guard);
    return () => {
      // Off before focus goes home, or the guard would pull it back in.
      document.removeEventListener("focusin", guard);
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open, present]);

  /* Escape closes; Tab stays inside the card; the page behind never scrolls. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      backwards.current = event.shiftKey;
      const panel = card.current;
      if (!panel) return;
      const list = tabStops(panel);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const at = document.activeElement;
      if (event.shiftKey && (at === first || !panel.contains(at))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (at === last || !panel.contains(at))) {
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

  /* Height: the body eases to whatever the step on screen needs. */
  const measureFit = useCallback(() => {
    const box = scroller.current;
    if (box) setFits(contentHeight.current <= box.clientHeight + 1);
  }, []);
  const onHeight = useCallback(
    (next: number) => {
      contentHeight.current = next;
      heightMove.current?.stop();
      if (!heightKnown.current || still) {
        heightKnown.current = true;
        heightValue.set(next);
      } else {
        heightMove.current = animate(heightValue, next, HEIGHT_SPRING);
      }
      requestAnimationFrame(measureFit);
    },
    [heightValue, measureFit, still],
  );
  useEffect(() => {
    const box = scroller.current;
    if (!present || !box) return;
    const observer = new ResizeObserver(measureFit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [present, measureFit]);

  /* A step change swaps out the button that was pressed, which would drop focus to <body>.
     Park it on the step line (which also announces "Step 2 of 6"), then hand it to the new
     step's first control. After a touch press it stays parked: a focused field would raise the keyboard. */
  useEffect(() => {
    if (stepMoved.current) status.current?.focus({ preventScroll: true });
  }, [step, phase]);

  const onEnter = useCallback((node: HTMLElement) => {
    scroller.current?.scrollTo({ top: 0 });
    if (!stepMoved.current) return;
    stepMoved.current = false;
    const at = document.activeElement;
    if (at !== status.current && at !== document.body && at !== null) return;
    if (lastPointer.current === "touch") return;
    const target =
      node.querySelector<HTMLElement>("input[type=radio]:checked") ??
      node.querySelector<HTMLElement>("input, textarea, select") ??
      node.querySelector<HTMLElement>("a[href], button");
    target?.focus({ preventScroll: true });
  }, []);

  const goTo = (to: number) => {
    direction.current = to >= step ? 1 : -1;
    stepMoved.current = true;
    setStep(to);
  };
  const switchPhase = (to: Phase, dir: number) => {
    direction.current = dir;
    stepMoved.current = true;
    setPhase(to);
  };

  /* ── Answers ───────────────────────────────────────────────────────────── */
  const set = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }));
    // A field you are fixing stops complaining as soon as you touch it.
    setErrors((e) => (e[field as RequestField] ? { ...e, [field]: undefined } : e));
  };
  const text = (field: Exclude<keyof Draft, "actions">) => ({
    name: field,
    value: draft[field],
    error: errors[field],
    onChange: (value: string) => set(field, value),
  });

  const focusFirstError = () =>
    requestAnimationFrame(() => card.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus({ preventScroll: true }));

  const details = draft as unknown as RequestDetails;
  const mailto = useMemo(() => {
    const subject = `Website for ${draft.business.trim() || "my business"}`;
    return `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${requestText(details)}\n`)}`;
  }, [details, draft.business]);

  const next = () => {
    const found = checkFields(draft, STEPS[step].fields);
    setErrors((e) => ({ ...e, ...found }));
    if (Object.keys(found).length) {
      focusFirstError();
      return;
    }
    goTo(Math.min(REVIEW, step + 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || phase !== "form") return;
    if (step < REVIEW) return next();
    // On the Pages mirror there is no server: the review step offers a mailto link instead.
    if (!HAS_API) return;
    await sendRequest(((event.nativeEvent as SubmitEvent).submitter ?? card.current) as Element);
  };

  async function sendRequest(from: Element) {
    // Everything once more, in case a field changed since its step.
    const found = checkFields(draft, STEPS.flatMap((st) => st.fields));
    const firstBad = STEPS.findIndex((st) => st.fields.some((f) => found[f]));
    if (firstBad >= 0) {
      setErrors(found);
      goTo(firstBad);
      focusFirstError();
      return;
    }
    setSending(true);
    setFormError(null);
    try {
      const res = await fetch(`${BASE}/api/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, nickname: trap, openedAt: openedAt.current ?? Date.now() }),
      });
      let data: { ok?: boolean; error?: string; errors?: Record<string, string> } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (res.ok && data?.ok) {
        const box = from.getBoundingClientRect();
        setSentTo(draft.email.trim());
        // The next request starts its own clock the next time the card opens.
        openedAt.current = null;
        switchPhase("sent", 1);
        if (!still) {
          // The burst starts from where the Send button was.
          const origin = document.createElement("span");
          Object.assign(origin.style, {
            position: "fixed",
            left: `${box.left}px`,
            top: `${box.top}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
            pointerEvents: "none",
          });
          document.body.appendChild(origin);
          import("./intake-celebrate")
            .then((m) => m.celebrate(origin))
            .catch(() => {})
            .finally(() => origin.remove());
        }
      } else if (res.status === 400 && data?.errors) {
        const mapped: Errors = {};
        for (const [field, message] of Object.entries(data.errors)) if (field in requestFields) mapped[field as RequestField] = message;
        const bad = STEPS.findIndex((st) => st.fields.some((f) => mapped[f]));
        if (bad >= 0) {
          setErrors(mapped);
          goTo(bad);
          focusFirstError();
        } else setFormError(data.error ?? "Some answers need another look.");
      } else if (res.status === 400 || res.status === 413 || res.status === 429) {
        setFormError(data?.error ?? "That didn’t go through. Please try again in a moment.");
      } else {
        switchPhase("fallback", 1);
      }
    } catch {
      switchPhase("fallback", 1);
    } finally {
      setSending(false);
    }
  }

  /* ── Dragging the card ─────────────────────────────────────────────────── */
  type Drag = { id: number; x: number; y: number; base: number; moving: boolean; samples: { y: number; t: number }[] };
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
    // One pointer only: a second touch never takes over a drag in progress.
    if (!e.isPrimary || drag.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, button, a")) return;
    const inHeader = header.current?.contains(target) ?? false;
    // A mouse drags from the header only. A finger can drag from anywhere on the card,
    // except the body's scroll area when it has something to scroll: that scrolls.
    if (e.pointerType === "mouse" && !inHeader) return;
    if (!inHeader && scroller.current?.contains(target) && scroller.current.dataset.fits === "false") return;
    move.current?.stop();
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, base: y.get(), moving: false, samples: [{ y: e.clientY, t: e.timeStamp }] };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moving) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.hypot(dx, dy) < DRAG_START_PX) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        drag.current = null; // a sideways swipe is not ours
        return;
      }
      d.moving = true;
      d.y = e.clientY; // 1:1 from here on, without a jump
      card.current?.setPointerCapture(e.pointerId);
      card.current?.classList.add(s.gripping);
    }
    const top = e.clientY - d.y + d.base;
    y.set(top >= 0 ? top : -rubber(-top));
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 8) d.samples.shift();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (!d.moving) return;
    if (card.current?.hasPointerCapture?.(e.pointerId)) card.current.releasePointerCapture(e.pointerId);
    card.current?.classList.remove(s.gripping);
    swallowClick.current = true;
    window.setTimeout(() => (swallowClick.current = false), 0);

    // Velocity over the last ~100ms; a pause before letting go counts as zero.
    const last = d.samples[d.samples.length - 1];
    const from = d.samples.find((p) => last.t - p.t <= 100) ?? last;
    const stale = e.timeStamp - last.t > 100;
    const v = cancelled || stale || last.t === from.t ? 0 : (last.y - from.y) / (last.t - from.t);

    const top = y.get();
    const height = card.current?.offsetHeight ?? 1;
    if (!cancelled && (top > height * DISMISS_FRACTION || (v > DISMISS_VELOCITY && top > 16))) {
      fling.current = Math.max(v * 1000, 900);
      onClose();
    } else if (still) {
      y.set(0);
    } else {
      move.current = animate(y, 0, { ...BACK_SPRING, velocity: v * 1000 });
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (!present) return null;

  const onReview = phase === "form" && step === REVIEW;
  const stepName = phase === "sent" ? "Sent" : phase === "fallback" ? "Not sent yet" : STEPS[step].name;
  const stepLine = phase === "form" ? `Step ${step + 1} of ${STEPS.length}: ` : "";
  const slideKey = phase === "form" ? `step-${step}` : phase;
  const pressLink = `${s.press} inline-flex min-h-11 shrink-0 items-center gap-2 text-[16px] font-semibold underline decoration-2 underline-offset-6 disabled:no-underline disabled:opacity-40`;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="intake-title">
      <motion.div aria-hidden onClick={onClose} className="absolute inset-0 bg-ink/65" style={{ opacity: veil }} />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          ref={card}
          data-surface="bone"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
          onClickCapture={(e) => {
            if (swallowClick.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          style={{ y, opacity: fade }}
          className={`${s.card} pointer-events-auto relative flex max-h-[calc(100dvh-8px)] w-full flex-col overflow-hidden rounded-t-[28px] shadow-[0_-12px_60px_rgba(21,18,15,0.35)] sm:max-h-[calc(100dvh-48px)] sm:max-w-[560px] sm:rounded-[28px] sm:shadow-[0_32px_90px_rgba(21,18,15,0.45)]`}
        >
          {/* Header: ember, the cube mark, the title, the progress. Drag from here with a mouse. */}
          <div ref={header} data-surface="ember" className={`${s.grip} flex-none px-6 pb-5 pt-3 sm:pt-6 md:px-8`}>
            <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-ink/40 sm:hidden" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <SmallMark className="w-9 shrink-0" />
                <div className="min-w-0">
                  <h2 id="intake-title" className="t-h3">
                    Ask for a preview
                  </h2>
                  {/* tabIndex -1: focus parks here between steps. */}
                  <p ref={status} tabIndex={-1} className="t-small mt-1 outline-none">
                    <span className="sr-only">{stepLine}</span>
                    {stepName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={`${s.press} flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-bone`}
              >
                <X size={20} strokeWidth={2.5} aria-hidden />
              </button>
            </div>
            <div aria-hidden className="mt-5 flex gap-2">
              {STEPS.map((st, i) => (
                <span key={st.id} className={s.seg} data-done={phase === "sent" || phase === "fallback" || i <= step}>
                  <span className={s.segFill} />
                </span>
              ))}
            </div>
          </div>

          <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            {/* The body: its height eases to the step's; its steps slide on a spring. */}
            <motion.div ref={scroller} data-fits={fits} className={`${s.scroll} relative min-h-0 flex-initial`} style={{ height: heightValue }}>
              <AnimatePresence initial={false} custom={direction.current}>
                <Slide key={slideKey} custom={direction.current} still={still} onHeight={onHeight} onEnter={onEnter}>
                  {phase === "sent" ? (
                    <Sent email={sentTo} />
                  ) : phase === "fallback" ? (
                    <Fallback mailto={mailto} opened={draftOpened} onOpened={() => setDraftOpened(true)} />
                  ) : (
                    <StepBody
                      step={step}
                      draft={draft}
                      errors={errors}
                      formError={formError}
                      text={text}
                      set={set}
                      mailto={mailto}
                      draftOpened={draftOpened}
                      onGo={goTo}
                    />
                  )}
                </Slide>
              </AnimatePresence>
            </motion.div>

            {/* The honeypot: invisible and unreachable for people. */}
            <label aria-hidden className={s.trap}>
              Leave this empty
              <input type="text" name="nickname" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </label>

            <div className="flex-none border-t-2 border-ink bg-bone px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-8">
              {phase === "sent" ? (
                <div className="flex justify-end">
                  <button type="button" onClick={onClose} className={`btn ${s.press}`}>
                    Close
                  </button>
                </div>
              ) : phase === "fallback" ? (
                <div className="flex items-center justify-between gap-4">
                  <button type="button" onClick={() => switchPhase("form", -1)} className={pressLink}>
                    <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
                    Try again
                  </button>
                  <a href={mailto} onClick={() => setDraftOpened(true)} className={`btn ${s.press}`}>
                    Open email draft
                    <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftOpened(false);
                      setFormError(null);
                      goTo(Math.max(0, step - 1));
                    }}
                    disabled={step === 0}
                    className={pressLink}
                  >
                    <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
                    Back
                  </button>
                  {onReview && !HAS_API ? (
                    <a href={mailto} onClick={() => setDraftOpened(true)} className={`btn ${s.press}`}>
                      Open email draft
                      <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
                    </a>
                  ) : (
                    <button type="submit" disabled={sending} className={`btn ${s.press}`}>
                      {onReview ? (sending ? "Sending…" : "Send request") : "Continue"}
                      {sending ? null : <ArrowRight size={18} strokeWidth={2.5} aria-hidden />}
                    </button>
                  )}
                </div>
              )}
              <div className={s.terms} data-open={onReview} inert={!onReview}>
                <p className="t-small pt-3 text-ink/80">
                  {HAS_API ? "By sending this you agree to our " : "By emailing us you agree to our "}
                  <a href={`${BASE}/legal/terms/`} target="_blank" rel="noreferrer" className={s.link}>
                    Terms<span className="sr-only"> (opens in a new tab)</span>
                  </a>{" "}
                  and our{" "}
                  <a href={`${BASE}/legal/privacy/`} target="_blank" rel="noreferrer" className={s.link}>
                    Privacy notice<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  .
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

/* ── What each step asks ────────────────────────────────────────────────── */

type StepBodyProps = {
  step: number;
  draft: Draft;
  errors: Errors;
  formError: string | null;
  text: (field: Exclude<keyof Draft, "actions">) => { name: string; value: string; error?: string; onChange: (v: string) => void };
  set: <K extends keyof Draft>(field: K, value: Draft[K]) => void;
  mailto: string;
  draftOpened: boolean;
  onGo: (step: number) => void;
};

function StepBody({ step, draft, errors, formError, text, set, mailto, draftOpened, onGo }: StepBodyProps) {
  switch (step) {
    case 0:
      return (
        <div className="flex flex-col gap-6">
          <p className="t-body">Tell us who to write back to. The rest comes next.</p>
          <Field label="Your name" autoComplete="name" {...text("name")} maxLength={100} />
          <Field label="Email" hint="We’ll reply here." type="email" inputMode="email" autoComplete="email" {...text("email")} maxLength={254} />
          <Field label="Phone (optional)" hint="Only if you’d rather talk." type="tel" inputMode="tel" autoComplete="tel" {...text("phone")} maxLength={30} />
        </div>
      );
    case 1:
      return (
        <div className="flex flex-col gap-6">
          <Field label="Business name" autoComplete="organization" {...text("business")} maxLength={120} />
          <SelectField label="What kind of business is it?" options={BUSINESS_KINDS} {...text("businessKind")} />
          <Field label="Town or city" autoComplete="address-level2" {...text("town")} maxLength={100} />
          <Field
            label="Current website (optional)"
            hint="Leave it blank if you don’t have one."
            inputMode="url"
            autoComplete="url"
            {...text("current")}
            maxLength={200}
          />
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col gap-8">
          <ChoiceGroup
            legend="What do you need?"
            name="need"
            type="radio"
            options={NEEDS}
            selected={draft.need ? [draft.need] : []}
            error={errors.need}
            onToggle={(id) => set("need", id)}
          />
          <ChoiceGroup
            legend="When do you need it?"
            name="timing"
            type="radio"
            options={TIMINGS}
            selected={draft.timing ? [draft.timing] : []}
            error={errors.timing}
            onToggle={(id) => set("timing", id)}
          />
        </div>
      );
    case 3:
      return (
        <div className="flex flex-col gap-7">
          <TextArea
            label="What’s the biggest problem with your site today?"
            hint="A sentence is plenty. If you don’t have a site, say so."
            rows={3}
            {...text("problem")}
            maxLength={1000}
          />
          <ChoiceGroup
            legend="What should people do on your site?"
            hint="Pick all that apply."
            name="actions"
            type="checkbox"
            options={ACTIONS}
            selected={draft.actions}
            error={errors.actions}
            onToggle={(id) => set("actions", draft.actions.includes(id) ? draft.actions.filter((a) => a !== id) : [...draft.actions, id])}
          />
          <TextArea
            label="Sites you like (optional)"
            hint="Paste a link or two, and say what you like about them."
            rows={3}
            {...text("links")}
            maxLength={600}
          />
        </div>
      );
    case 4:
      return (
        <div className="flex flex-col gap-6">
          <p className="t-body">Everything on this page is optional. Skip it and we’ll work from what you’ve told us.</p>
          <TextArea label="Brand colours or logo link" hint="Colour names or hex codes, or a link to your logo." rows={2} {...text("brand")} maxLength={300} />
          <TextArea label="Opening hours" rows={2} {...text("hours")} maxLength={300} />
          <TextArea label="Services you offer" hint="A list is fine." rows={3} {...text("services")} maxLength={800} />
          <TextArea label="Anything else we should know?" rows={3} {...text("extra")} maxLength={1500} />
        </div>
      );
    default:
      return <Review draft={draft} formError={formError} mailto={mailto} draftOpened={draftOpened} onGo={onGo} />;
  }
}

function Review({
  draft,
  formError,
  mailto,
  draftOpened,
  onGo,
}: {
  draft: Draft;
  formError: string | null;
  mailto: string;
  draftOpened: boolean;
  onGo: (step: number) => void;
}) {
  const sections = requestSections(draft as unknown as RequestDetails);
  return (
    <div>
      <p className="t-body">
        {HAS_API
          ? "Here’s what you told us. When you send it, it goes straight to our inbox, and we’ll email you a confirmation."
          : "Here’s what you told us. The button below opens it as an email in your own email app, all filled in. Nothing reaches us until you hit send."}
      </p>
      {formError ? (
        <p role="alert" className="t-body mt-5 bg-ember p-4 font-medium text-ink">
          {formError} You can also email us at{" "}
          <a href={mailto} className={s.link}>
            {STUDIO_EMAIL}
          </a>
          .
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-6">
        {sections.map(([heading, rows]) => (
          <section key={heading} aria-label={heading}>
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <h3 className="text-[14px] font-bold uppercase tracking-[0.04em]">{heading}</h3>
              <button
                type="button"
                onClick={() => onGo(SECTION_STEP[heading] ?? 0)}
                className={`${s.press} ${s.link} -my-2 min-h-11 px-1 text-[14px] font-semibold`}
              >
                Edit<span className="sr-only"> {heading.toLowerCase()}</span>
              </button>
            </div>
            <dl className="divide-y divide-ink/25">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
                  <dt className="t-small shrink-0 text-ink/75 sm:w-40">{label}</dt>
                  <dd data-selectable className="min-w-0 whitespace-pre-line break-words text-[16px] font-medium">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      {draftOpened ? (
        <p className="t-body mt-6 flex items-start gap-3 bg-ember p-4 font-medium text-ink" role="status">
          <Check size={18} strokeWidth={3} aria-hidden className="mt-[3px] shrink-0" />
          <span>Your email app should’ve opened. If it didn’t, email us at {STUDIO_EMAIL}. Once it’s sent, one of us will write back.</span>
        </p>
      ) : null}
    </div>
  );
}

function Sent({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex h-12 w-12 items-center justify-center bg-ember text-ink">
        <Check size={24} strokeWidth={3} aria-hidden />
      </p>
      <h3 className="t-h3">Request sent.</h3>
      <p className="t-body" data-selectable>
        We’ll email you at <strong className="break-all font-semibold">{email}</strong> within one business day. You should get a
        confirmation there too. If you don’t see it, check your spam folder.
      </p>
    </div>
  );
}

function Fallback({ mailto, opened, onOpened }: { mailto: string; opened: boolean; onOpened: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="t-h3">That didn’t go through.</h3>
      <p className="t-body">
        The first way didn’t work, and nothing has been sent yet. You can send the same request from your own email app instead: the button
        below opens it with everything filled in.
      </p>
      <p className="t-body">
        Or try again in a minute, or write to us at{" "}
        <a href={mailto} onClick={onOpened} className={s.link}>
          {STUDIO_EMAIL}
        </a>
        .
      </p>
      {opened ? (
        <p className="t-body flex items-start gap-3 bg-ember p-4 font-medium text-ink" role="status">
          <Check size={18} strokeWidth={3} aria-hidden className="mt-[3px] shrink-0" />
          <span>Your email app should’ve opened. Once you hit send there, one of us will write back.</span>
        </p>
      ) : null}
    </div>
  );
}
