import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site does and does not collect.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="September 2026"
      clauses={[
        {
          heading: "This site collects nothing",
          body: (
            <p>
              There is no analytics, no advertising and no tracking cookie on this site. We do not know who you are or
              that you visited.
            </p>
          ),
        },
        {
          heading: "The project form",
          body: (
            <p>
              Everything you type into the project form stays in your browser. Pressing send opens your own email app
              with the details filled in, so nothing reaches us until you send that email yourself. Close the tab
              instead and it is gone.
            </p>
          ),
        },
        {
          heading: "If you do email us",
          body: (
            <p>
              We keep what you send so we can reply and quote the work: your name, business, email and whatever you
              told us about the project. We do not sell it, share it or add you to a mailing list. Ask us to delete it
              and we will.
            </p>
          ),
        },
        {
          heading: "Hosting and embeds",
          body: (
            <p>
              The site is served as static files, and the host keeps standard technical logs such as IP address and
              request time to deliver and protect the pages. The showcase previews on the work page load those sites
              from GitHub Pages, so GitHub sees those requests the same way it would if you opened them directly.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Privacy questions go to <a className="text-ember hover:underline" href="mailto:studio@hvnf.dev">studio@hvnf.dev</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
