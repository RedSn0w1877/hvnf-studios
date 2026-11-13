import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import { liteScript } from "@/lib/device";
import { SITE_URL } from "@/lib/studio";
import "./globals.css";

// Two families, latin only, one woff2 each, both preloaded (68 KB together).
//
// Bricolage Grotesque sets the display type (h1–h3, numerals, the payment bar),
// only ever at weight 800. Google serves it as one variable file with both its
// axes, wght 200–800 and opsz 12–96: 77 KB, most of it weights this site never
// draws. fonts/bricolage-grotesque-800.woff2 is that same latin file pinned to
// wght 800 with fontTools' instancer, opsz kept (38 KB). The opsz axis is the
// point of keeping it variable: the browser picks the tight display cut at
// headline sizes and the open text cut in a 15px number square
// (font-optical-sizing is auto by default).
// Bricolage Grotesque is © 2022 The Bricolage Grotesque Project Authors, under
// the SIL Open Font License 1.1, which allows this modified copy.
const display = localFont({
  src: "./fonts/bricolage-grotesque-800.woff2",
  weight: "800",
  style: "normal",
  display: "swap",
  variable: "--font-bricolage",
});

// Instrument Sans sets everything you read, 400 to 700 from one variable file.
const text = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  // The origin only. File-based metadata (opengraph-image.jpg, icon.svg) already
  // carries the basePath in its URL, and Next joins it onto the base's path, so
  // SITE_URL's /hvnf-studios here would print /hvnf-studios/hvnf-studios/ on
  // GitHub Pages. A canonical or og:url added later should use SITE_URL itself.
  metadataBase: new URL("/", SITE_URL),
  title: {
    default: "HVNF Studios | Beautiful websites for beautiful businesses",
    template: "%s | HVNF Studios",
  },
  description:
    "We’re a small studio making fast websites for auto shops, contractors, dentists and other local businesses. Try yours on your phone before you pay.",
  applicationName: "HVNF Studios",
  // The image comes from opengraph-image.jpg and its .alt.txt beside this file.
  openGraph: {
    title: "HVNF Studios | Beautiful websites for beautiful businesses",
    description:
      "We’re a small studio. We build your new site first, and you try it on your phone before you pay anything.",
    type: "website",
  },
  // Next copies the title, description and image over from openGraph; this
  // only asks X for the full-width card instead of the small square one.
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  // The ember field: the first thing on the page, so the browser bar matches it.
  themeColor: "#EF4623",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the head script below adds `js` and `data-lite` to
    // <html> before React hydrates, and the DOM's answer is the one we want kept.
    <html lang="en" className={`${text.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Runs while the HTML parses, before first paint (see device.ts), so CSS
          can branch on html[data-lite] and html.js from the very first frame.
          page.tsx re-applies the live answer after hydration, which also covers
          resizes.
        */}
        <script dangerouslySetInnerHTML={{ __html: liteScript() }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
