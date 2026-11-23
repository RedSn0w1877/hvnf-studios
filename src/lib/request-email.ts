import { STUDIO_EMAIL } from "./studio";
import { requestSections, requestText, type Row } from "./request-format";
import { BUSINESS_KINDS, NEEDS, TIMINGS, ACTIONS, type RequestDetails } from "./validations";

/**
 * The two emails a request sends, as Resend's REST body. Server only.
 * Every visitor-supplied string that reaches the HTML goes through escapeHtml;
 * nothing is ever linkified, so there is no markup or link a visitor can plant.
 *
 * The HTML is written the way email clients need it: tables, inline styles, a
 * system font stack, and one small <style> block that only adds a dark theme
 * and a narrow-screen tweak where a client supports it. Everything is readable
 * without that block.
 */
export const FROM = "HVNF Studios <requests@send.hvnfstudios.com>";

export type OutgoingEmail = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  html: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const EMBER = "#ef4623";
const INK = "#15120f";
const BONE = "#f1eadb";
const MUTED = "#6b645a";
const RULE = "#e4dccb";

const labelOf = (list: readonly { id: string; label: string }[], id: string) => list.find((item) => item.id === id)?.label ?? "";

/** Light first; the dark rules only apply where the client honours prefers-color-scheme. */
const STYLE = `
:root{color-scheme:light dark;supported-color-schemes:light dark}
@media (max-width:520px){
  .px{padding-left:20px!important;padding-right:20px!important}
  .stack{display:block!important;width:100%!important;box-sizing:border-box}
  .lab{display:block!important;width:100%!important;padding:10px 0 0!important}
  .val{display:block!important;width:100%!important;padding:2px 0 10px!important}
  .big{font-size:26px!important}
}
@media (prefers-color-scheme:dark){
  .bg{background:#15120f!important}
  .card{background:#1f1a16!important}
  .ink{color:#f1eadb!important}
  .mute{color:#b9b09f!important}
  .rule{border-color:#3a322b!important}
  .chip{background:#2a231d!important}
  .note{background:#2a231d!important}
}`;

/** One labelled row: label left, answer right; stacked on a narrow screen. */
function rowHtml({ label, value }: Row): string {
  return `<tr><td class="lab mute rule" valign="top" style="width:150px;padding:11px 16px 11px 0;border-top:1px solid ${RULE};font-size:13px;line-height:1.4;color:${MUTED}">${escapeHtml(label)}</td><td class="val ink rule" valign="top" style="padding:11px 0;border-top:1px solid ${RULE};font-size:16px;line-height:1.5;color:${INK}">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`;
}

function sectionHtml(heading: string, rows: Row[]): string {
  return `<tr><td class="px" style="padding:30px 32px 0"><div style="font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${EMBER}">${escapeHtml(heading)}</div><div style="height:6px;line-height:6px;font-size:0">&nbsp;</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${rows.map(rowHtml).join("")}</table></td></tr>`;
}

/** The whole page: hidden preview line, ember header, body rows, quiet footer. */
function shell(opts: { preheader: string; eyebrow: string; title: string; sub: string; body: string; footer: string }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(opts.title)}</title><style>${STYLE}</style></head><body class="bg" style="margin:0;padding:0;background:${BONE};font-family:${FONT};color:${INK}"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px">${escapeHtml(opts.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="bg" style="background:${BONE}"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="card" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden"><tr><td class="px" style="background:${EMBER};padding:26px 32px 30px"><div style="font-size:13px;font-weight:800;letter-spacing:.04em;color:${INK}">HVNF Studios</div><div style="height:22px;line-height:22px;font-size:0">&nbsp;</div><div style="font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${INK}">${escapeHtml(opts.eyebrow)}</div><div class="big" style="margin-top:6px;font-size:32px;line-height:1.1;font-weight:800;letter-spacing:-.01em;color:${INK}">${escapeHtml(opts.title)}</div><div style="margin-top:10px;font-size:16px;line-height:1.4;color:${INK}">${escapeHtml(opts.sub)}</div></td></tr>${opts.body}<tr><td class="px" style="padding:30px 32px 30px"><div class="rule" style="border-top:1px solid ${RULE};padding-top:16px;font-size:12px;line-height:1.5;color:${MUTED}"><span class="mute">${opts.footer}</span></div></td></tr></table></td></tr></table></body></html>`;
}

/** Three short facts the studio wants before opening anything. */
function glance(d: RequestDetails): string {
  const facts: Row[] = [
    { label: "Looking for", value: labelOf(NEEDS, d.need) },
    { label: "Timing", value: labelOf(TIMINGS, d.timing) },
    { label: "Wants people to", value: d.actions.map((id) => labelOf(ACTIONS, id)).join(", ") },
  ].filter((f) => f.value);
  const cells = facts
    .map(
      (f) =>
        `<td class="stack" valign="top" style="padding:0 6px 8px 0;width:${Math.floor(100 / facts.length)}%"><div class="chip" style="background:${BONE};border-radius:10px;padding:12px 14px"><div class="mute" style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${MUTED}">${escapeHtml(f.label)}</div><div class="ink" style="margin-top:4px;font-size:15px;line-height:1.3;font-weight:700;color:${INK}">${escapeHtml(f.value)}</div></div></td>`,
    )
    .join("");
  return `<tr><td class="px" style="padding:26px 26px 0 32px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${cells}</tr></table></td></tr>`;
}

const when = () =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());

/** To the studio. Reply goes straight to the visitor. */
export function studioEmail(d: RequestDetails): OutgoingEmail {
  const kind = labelOf(BUSINESS_KINDS, d.businessKind);
  const sections = requestSections(d)
    .map(([heading, rows]) => sectionHtml(heading, rows))
    .join("");
  const note = `<tr><td class="px" style="padding:30px 32px 0"><div class="note ink" style="background:${BONE};border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.5;color:${INK}"><strong>Reply to this email</strong> to write to ${escapeHtml(d.name)}. It goes straight to them.</div></td></tr>`;
  return {
    from: FROM,
    to: [STUDIO_EMAIL],
    reply_to: d.email,
    subject: `New preview request: ${d.business}`,
    text: `New preview request from the homepage. Reply to this email to write to ${d.name}.\n\n${requestText(d)}\n`,
    html: shell({
      preheader: `${d.name} in ${d.town} wants ${labelOf(NEEDS, d.need).toLowerCase()}. ${d.problem}`.slice(0, 140),
      eyebrow: "New preview request",
      title: d.business,
      sub: `${d.name} · ${d.town}${kind ? ` · ${kind}` : ""}`,
      body: `${glance(d)}${sections}${note}`,
      footer: `Sent from the request form on hvnfstudios.com · ${escapeHtml(when())} ET`,
    }),
  };
}

/** To the visitor. Short, plain, and it says what happens next. */
export function visitorEmail(d: RequestDetails): OutgoingEmail {
  const first = d.name.split(/\s+/)[0] || d.name;
  const lines = [
    `Hi ${first},`,
    `Got it. We have your request for ${d.business}, and we’ll be in touch within one business day.`,
    `If anything changes in the meantime, just reply to this email.`,
    `HVNF Studios`,
  ];
  const recap = requestSections(d)
    .map(([heading, rows]) => sectionHtml(heading, rows))
    .join("");
  const message = `<tr><td class="px" style="padding:30px 32px 0">${[`We have your request for ${d.business}.`, lines[2]]
    .map((l) => `<p class="ink" style="margin:0 0 14px;font-size:17px;line-height:1.55;color:${INK}">${escapeHtml(l)}</p>`)
    .join("")}<p class="ink" style="margin:0;font-size:17px;line-height:1.55;font-weight:700;color:${INK}">HVNF Studios</p></td></tr><tr><td class="px" style="padding:30px 32px 0"><div class="mute" style="font-size:13px;line-height:1.5;color:${MUTED}">This is what you sent us, in case you want to check it.</div></td></tr>`;
  return {
    from: FROM,
    to: [d.email],
    reply_to: STUDIO_EMAIL,
    subject: "We got your preview request",
    text: `${lines.join("\n\n")}\n\nThis is what you sent us:\n\n${requestText(d)}\n`,
    html: shell({
      preheader: `Got it. We’ll be in touch within one business day.`,
      eyebrow: "Request received",
      title: `Got it, ${first}.`,
      sub: `We’ll be in touch within one business day.`,
      body: `${message}${recap}`,
      footer: `You’re getting this because someone used the request form on hvnfstudios.com with this address. Reply to this email to reach us.`,
    }),
  };
}
