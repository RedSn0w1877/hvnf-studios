import { STUDIO_EMAIL } from "./studio";
import { requestSections, requestText } from "./request-format";
import type { RequestDetails } from "./validations";

/**
 * The two emails a request sends, as Resend's REST body. Server only.
 * Every visitor-supplied string that reaches the HTML goes through escapeHtml;
 * nothing is ever linkified, so there is no markup or link a visitor can plant.
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

const WRAP = (inner: string) =>
  `<!doctype html><html><body style="margin:0;padding:24px;background:#f1eadb;color:#15120f;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5"><div style="max-width:600px;margin:0 auto;background:#ffffff;padding:24px">${inner}</div></body></html>`;

/** To the studio. Reply goes straight to the visitor. */
export function studioEmail(d: RequestDetails): OutgoingEmail {
  const sections = requestSections(d)
    .map(([heading, rows]) => {
      const body = rows
        .map(
          ({ label, value }) =>
            `<tr><td style="padding:6px 16px 6px 0;vertical-align:top;color:#5a544c;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;vertical-align:top">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`,
        )
        .join("");
      return `<h2 style="margin:24px 0 4px;font-size:14px;letter-spacing:.06em;text-transform:uppercase">${escapeHtml(heading)}</h2><table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-top:2px solid #15120f">${body}</table>`;
    })
    .join("");
  return {
    from: FROM,
    to: [STUDIO_EMAIL],
    reply_to: d.email,
    subject: `New preview request: ${d.business}`,
    text: `New preview request from the homepage. Reply to this email to write to ${d.name}.\n\n${requestText(d)}\n`,
    html: WRAP(`<h1 style="margin:0 0 8px;font-size:22px">New preview request</h1><p style="margin:0">Reply to this email to write to ${escapeHtml(d.name)}.</p>${sections}`),
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
  return {
    from: FROM,
    to: [d.email],
    reply_to: STUDIO_EMAIL,
    subject: "We got your preview request",
    text: `${lines.join("\n\n")}\n\nThis is what you sent us:\n\n${requestText(d)}\n`,
    html: WRAP(
      `${lines.map((l) => `<p style="margin:0 0 16px">${escapeHtml(l)}</p>`).join("")}<p style="margin:24px 0 8px;color:#5a544c">This is what you sent us:</p><pre style="margin:0;white-space:pre-wrap;font-family:inherit;font-size:14px">${escapeHtml(requestText(d))}</pre>`,
    ),
  };
}
