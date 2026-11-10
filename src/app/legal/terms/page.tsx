import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { STUDIO_EMAIL } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that cover using this site and working with HVNF Studios.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="October 2026"
      summary="Short version: the sample businesses on this site are made up, and nothing’s binding until we’ve both agreed to a written quote."
      clauses={[
        {
          heading: "Use of this site and intellectual property",
          body: (
            <p>
              Access to this site is offered subject to these terms. All design, source code, text, imagery and marks
              appearing on it remain the property of HVNF Studios. No license is granted to reproduce, redistribute,
              adapt or republish any part of it, whether as a template or otherwise, without our prior written consent.
            </p>
          ),
        },
        {
          heading: "Status of the sample sites",
          body: (
            <p>
              The businesses presented as samples on this site, including Penner &amp; Daughters Auto Repair, Kroma Labs,
              Apex Dynamics and Aetheria Botanicals, are fictional and were created solely to demonstrate our capabilities. They do not denote
              trading entities, no goods or services presented on them are available for purchase, and all figures,
              specifications and availability stated within them are illustrative only.
            </p>
          ),
        },
        {
          heading: "Inquiries do not constitute a contract",
          body: (
            <p>
              Submission of a brief through this site constitutes an inquiry only. It does not commission work, fix a
              price, reserve capacity, or create any contractual obligation on either party. No engagement arises until
              both parties have agreed to a written quotation.
            </p>
          ),
        },
        {
          heading: "Precedence of project terms",
          body: (
            <p>
              Scope, fees, schedule and payment terms are set out in the written quotation issued for each project. That
              quotation governs the engagement and prevails over anything stated on this page in the event of any
              conflict or inconsistency.
            </p>
          ),
        },
        {
          heading: "Availability of this site",
          body: (
            <p>
              This site is provided on an “as available” basis. While we take reasonable care to keep it accurate and
              accessible, we do not warrant uninterrupted availability, and we may amend or withdraw any part of it,
              including these terms, without prior notice.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Inquiries regarding these terms should be directed to{" "}
              <a className="text-ember underline underline-offset-4 hover:text-bone" href={`mailto:${STUDIO_EMAIL}`}>
                {STUDIO_EMAIL}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
