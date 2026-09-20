import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that cover using this site and working with HVNF Studios.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="September 2026"
      clauses={[
        {
          heading: "Using this site",
          body: (
            <p>
              You are welcome to browse this site and the work shown on it. The design, code, words and marks here
              belong to HVNF Studios; please do not copy them, reuse them as a template, or pass them off as your own
              work without asking us first.
            </p>
          ),
        },
        {
          heading: "The showcase builds",
          body: (
            <p>
              Kroma Labs, Apex Dynamics and Aetheria Botanicals are fictional brands we invented to demonstrate what we
              can build. They are not real businesses, nothing on them is for sale, and any figures they quote are
              illustrative.
            </p>
          ),
        },
        {
          heading: "Enquiries are not contracts",
          body: (
            <p>
              Sending us a brief through this site starts a conversation, nothing more. No work is commissioned, no
              price is agreed and no booking is held until we have both signed off a written quote.
            </p>
          ),
        },
        {
          heading: "What we agree per project",
          body: (
            <p>
              Scope, price, schedule and payment terms live in the quote for your project rather than on this page. That
              document is what governs the work, and it takes precedence over anything written here.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about these terms go to <a className="text-ember hover:underline" href="mailto:studio@hvnf.dev">studio@hvnf.dev</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
