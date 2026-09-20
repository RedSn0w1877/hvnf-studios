"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { STUDIO_EMAIL } from "@/lib/studio";
import { Magnetic, SETTLE } from "./kit";

/**
 * Project intake.
 *
 * This site is a static export with no server, so the drawer does not pretend to
 * submit anywhere. It collects the brief, shows it back, and hands it to the
 * visitor's mail client addressed to the studio — a real path that works offline
 * of any backend, and never claims to have sent something it did not.
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
  const opener = useRef<Element | null>(null);
  const reduce = useReducedMotion();

  // Focus management: remember what opened the drawer, move focus in, put it back.
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const first = panel.current?.querySelector<HTMLElement>("button, input, textarea, a[href]");
    first?.focus();
    return () => {
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
      const focusables = panel.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, textarea, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const list = Array.from(focusables);
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
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

  // Reset a beat after closing, so the drawer does not visibly rewind on the way out.
  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
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
      setStep(3);
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const openEmail = () => setEmailRequested(true);

  const stepLabel = ["What you need", "Timing", "About you", "Review"][step] ?? "";

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
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto border-l border-rule bg-carbon"
          >
            <div className="flex items-center justify-between border-b border-rule px-6 py-5 md:px-8">
              <div>
                <h2 id="intake-title" className="text-lg font-semibold tracking-tight text-bone">
                  Start a project
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
                  {emailRequested ? "Ready to send" : `Step ${step + 1} of 4 — ${stepLabel}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-rule text-ash transition-colors hover:text-bone"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            {/* Progress */}
            <div aria-hidden className="flex gap-1 px-6 pt-4 md:px-8">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-px flex-1 overflow-hidden bg-rule">
                  <motion.span
                    className="block h-full origin-left bg-ember"
                    initial={false}
                    animate={{ scaleX: i <= step ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: SETTLE }}
                  />
                </span>
              ))}
            </div>

            <div className="flex-1 px-6 py-8 md:px-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: SETTLE }}
                >
                  {step === 0 ? (
                    <fieldset>
                      <legend className="text-[15px] text-ash">What do you need?</legend>
                      <div className="mt-5 flex flex-col gap-2">
                        {KINDS.map((option) => (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                              kind === option.id ? "border-ember bg-graphite" : "border-rule hover:border-rule-strong"
                            }`}
                          >
                            <input
                              type="radio"
                              name="kind"
                              value={option.id}
                              checked={kind === option.id}
                              onChange={() => setKind(option.id)}
                              className="mt-1 h-4 w-4 accent-[#E9A568]"
                            />
                            <span>
                              <span className="block text-[15px] font-medium text-bone">{option.label}</span>
                              <span className="mt-1 block text-sm text-muted">{option.note}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {step === 1 ? (
                    <fieldset>
                      <legend className="text-[15px] text-ash">When would you like it live?</legend>
                      <div className="mt-5 flex flex-col gap-2">
                        {TIMING.map((option) => (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                              timing === option.id ? "border-ember bg-graphite" : "border-rule hover:border-rule-strong"
                            }`}
                          >
                            <input
                              type="radio"
                              name="timing"
                              value={option.id}
                              checked={timing === option.id}
                              onChange={() => setTiming(option.id)}
                              className="h-4 w-4 accent-[#E9A568]"
                            />
                            <span className="text-[15px] text-bone">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {step === 2 ? (
                    <div className="flex flex-col gap-5">
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
                      <label className="flex flex-col gap-2">
                        <span className="eyebrow">Anything else (optional)</span>
                        <textarea
                          rows={4}
                          value={details.notes}
                          onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
                          className="resize-none rounded-lg border border-rule bg-ink px-4 py-3 text-[15px] text-bone outline-none transition-colors focus:border-ember"
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div>
                      <p className="text-[15px] leading-relaxed text-ash">
                        Here is your brief. Open an email draft with it all filled in, then send it from your email
                        app. Nothing leaves this page until you send it.
                      </p>
                      <dl className="mt-6 divide-y divide-rule border-y border-rule">
                        {[
                          ["Business", details.business],
                          ["Name", details.name],
                          ["Email", details.email],
                          ["Needs", KINDS.find((k) => k.id === kind)?.label ?? "—"],
                          ["Timing", TIMING.find((t) => t.id === timing)?.label ?? "—"],
                          ["Current site", details.current || "—"],
                        ].map(([term, value]) => (
                          <div key={term} className="flex gap-6 py-3">
                            <dt className="w-32 shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                              {term}
                            </dt>
                            <dd className="min-w-0 break-words text-[15px] text-bone">{value}</dd>
                          </div>
                        ))}
                      </dl>

                      {emailRequested ? (
                        <p className="mt-6 flex items-center gap-2 text-[15px] text-arc" role="status">
                          <Check size={16} aria-hidden />
                          Your email app should be open. If it did not, write to {STUDIO_EMAIL}.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-rule bg-carbon px-6 py-5 md:px-8">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-bone disabled:opacity-40"
              >
                <ArrowLeft size={14} aria-hidden />
                Back
              </button>

              {step < 3 ? (
                <Magnetic onClick={next} disabled={!canAdvance} className={canAdvance ? "" : "cursor-not-allowed opacity-40"}>
                  Continue
                  <ArrowRight size={14} aria-hidden />
                </Magnetic>
              ) : (
                <Magnetic href={mailto} onClick={openEmail} className="!px-4 !text-[10px] sm:!px-7 sm:!text-xs">
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
  return (
    <label className="flex flex-col gap-2">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`rounded-lg border bg-ink px-4 py-3 text-[15px] text-bone outline-none transition-colors ${
          error ? "border-ember-deep" : "border-rule focus:border-ember"
        }`}
      />
      {error ? <span className="text-sm text-ember">{error}</span> : null}
    </label>
  );
}
