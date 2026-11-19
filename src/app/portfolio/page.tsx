import type { Metadata, Viewport } from "next";
import { Portfolio } from "@/components/portfolio/portfolio";

/*
 * /portfolio/: the four demo sites, one bento at a time (components/portfolio).
 * The homepage's Nav and Footer live in app/page.tsx, not in the layout, so
 * nothing of the homepage renders here and nothing here touches it.
 */

export const metadata: Metadata = {
  // The layout's template turns this into "Portfolio | HVNF Studios".
  title: "Portfolio",
  description:
    "Four websites HVNF Studios made for made-up brands: an auto shop, a keyboard maker, a trail shoe and a perfumer. Each one is a working site you can open.",
  openGraph: {
    title: "Portfolio | HVNF Studios",
    description: "Four working websites we made: an auto shop, a keyboard maker, a trail shoe and a perfumer.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ECEDEE",
  colorScheme: "light",
};

export default function PortfolioPage() {
  return <Portfolio />;
}
