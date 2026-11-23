"use client";

import { useId, type ReactNode } from "react";
import s from "./intake.module.css";

/*
 * The card's form controls. Every control has a visible label (never a
 * placeholder standing in for one), its own error line underneath, and the
 * autofill token and input type a phone's keyboard needs. Boxed fields are
 * white inside a 2px ink border, 52px tall, square; 16px text keeps iOS from
 * zooming on focus. The error is ink on an ember block (4.95:1) with an inset
 * ember frame on the box, so it never relies on colour alone.
 */

const LABEL = "text-[14px] font-semibold";
const BOX = "w-full min-h-[52px] rounded-none border-2 bg-white px-3.5 text-[16px] text-ink";
const BOX_REST = "border-ink";
const BOX_ERROR = "border-ink shadow-[inset_0_0_0_3px_var(--color-ember)]";

function ErrorLine({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <span id={id} className="t-small self-start bg-ember px-2.5 py-1 font-semibold text-ink">
      {children}
    </span>
  );
}

type Common = {
  label: string;
  /** One quiet line under the label: what to put here. */
  hint?: string;
  error?: string;
  /** The key this field is stored under, so the card can find it to focus. */
  name: string;
};

export function Field({
  label,
  hint,
  error,
  name,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
}: Common & {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
  maxLength?: number;
}) {
  const id = useId();
  const described = [hint ? `${id}-h` : "", error ? `${id}-e` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {hint ? (
          <span id={`${id}-h`} className="t-small text-ink/75">
            {hint}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        name={name}
        data-field={name}
        type={type}
        inputMode={inputMode}
        value={value}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" || inputMode === "url" ? "none" : undefined}
        spellCheck={type === "email" || inputMode === "url" ? false : undefined}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className={`${BOX} ${error ? BOX_ERROR : BOX_REST}`}
      />
      <ErrorLine id={`${id}-e`}>{error}</ErrorLine>
    </div>
  );
}

export function TextArea({
  label,
  hint,
  error,
  name,
  value,
  onChange,
  rows = 3,
  maxLength,
}: Common & { value: string; onChange: (value: string) => void; rows?: number; maxLength?: number }) {
  const id = useId();
  const described = [hint ? `${id}-h` : "", error ? `${id}-e` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {hint ? (
          <span id={`${id}-h`} className="t-small text-ink/75">
            {hint}
          </span>
        ) : null}
      </div>
      <textarea
        id={id}
        name={name}
        data-field={name}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className={`${BOX} resize-none py-3 ${error ? BOX_ERROR : BOX_REST}`}
      />
      <ErrorLine id={`${id}-e`}>{error}</ErrorLine>
    </div>
  );
}

export function SelectField({
  label,
  error,
  name,
  value,
  onChange,
  options,
  autoComplete,
}: Common & {
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        data-field={name}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : undefined}
        className={`${BOX} ${s.select} ${error ? BOX_ERROR : BOX_REST}`}
      >
        <option value="">Choose one</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorLine id={`${id}-e`}>{error}</ErrorLine>
    </div>
  );
}

/** A group of choices under a visible legend. `type` radio picks one, checkbox picks any. */
export function ChoiceGroup({
  legend,
  hint,
  error,
  name,
  type,
  options,
  selected,
  onToggle,
}: {
  legend: ReactNode;
  hint?: string;
  error?: string;
  name: string;
  type: "radio" | "checkbox";
  options: readonly { id: string; label: string; note?: string }[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}) {
  const id = useId();
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3"
      aria-describedby={error ? `${id}-e` : undefined}
    >
      <legend className="mb-3 w-full text-[16px] font-bold">{legend}</legend>
      {hint ? <p className="t-small -mt-1 mb-1 text-ink/75">{hint}</p> : null}
      {options.map((option, index) => {
        const checked = selected.includes(option.id);
        return (
          <label key={option.id} className={s.choice}>
            <input
              type={type}
              name={name}
              value={option.id}
              checked={checked}
              data-field={index === 0 ? name : undefined}
              onChange={() => onToggle(option.id)}
              aria-invalid={error ? true : undefined}
              className="sr-only"
            />
            <span className={`flex gap-4 ${option.note ? "items-start" : "items-center"}`}>
              <span aria-hidden className={s.choiceBox} />
              <span>
                <span className="block text-[16px] font-semibold">{option.label}</span>
                {option.note ? (
                  <span className={`${s.choiceNote} mt-1 block text-pretty text-[14px]`}>{option.note}</span>
                ) : null}
              </span>
            </span>
          </label>
        );
      })}
      <ErrorLine id={`${id}-e`}>{error}</ErrorLine>
    </fieldset>
  );
}
