import { ACTIONS, BUSINESS_KINDS, NEEDS, TIMINGS, type RequestDetails } from "./validations";

/**
 * One reading of a request, shared by the studio email, the visitor's copy and
 * the mailto fallback, so the three always say the same thing.
 */
export type Row = { label: string; value: string };

const labelOf = (list: readonly { id: string; label: string }[], id: string) =>
  list.find((item) => item.id === id)?.label ?? "Not specified";

/** [heading, rows]. Blank optional fields are left out. */
export function requestSections(d: RequestDetails): [string, Row[]][] {
  const keep = (rows: Row[]) => rows.filter((row) => row.value.trim() !== "");
  return [
    [
      "Contact",
      keep([
        { label: "Name", value: d.name },
        { label: "Email", value: d.email },
        { label: "Phone", value: d.phone },
      ]),
    ],
    [
      "Business",
      keep([
        { label: "Business", value: d.business },
        { label: "Kind of business", value: labelOf(BUSINESS_KINDS, d.businessKind) },
        { label: "Town", value: d.town },
        { label: "Current site", value: d.current },
      ]),
    ],
    [
      "What they need",
      keep([
        { label: "Looking for", value: labelOf(NEEDS, d.need) },
        { label: "Timing", value: labelOf(TIMINGS, d.timing) },
        { label: "Biggest problem today", value: d.problem },
        { label: "Wants people to", value: d.actions.map((id) => labelOf(ACTIONS, id)).join(", ") },
        { label: "Sites they like", value: d.links },
      ]),
    ],
    [
      "For the preview",
      keep([
        { label: "Brand colours or logo", value: d.brand },
        { label: "Opening hours", value: d.hours },
        { label: "Services", value: d.services },
        { label: "Anything else", value: d.extra },
      ]),
    ],
  ].filter(([, rows]) => (rows as Row[]).length > 0) as [string, Row[]][];
}

/** Plain text, one block per section. Multi-line answers are indented under their label. */
export function requestText(d: RequestDetails): string {
  return requestSections(d)
    .map(([heading, rows]) => {
      const body = rows
        .map(({ label, value }) => (value.includes("\n") ? `${label}:\n${value.replace(/^/gm, "  ")}` : `${label}: ${value}`))
        .join("\n");
      return `${heading.toUpperCase()}\n${body}`;
    })
    .join("\n\n");
}
