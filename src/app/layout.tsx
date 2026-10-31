import type { Metadata, Viewport } from "next";
import { Encode_Sans, Encode_Sans_Expanded } from "next/font/google";
import { liteScript } from "@/lib/device";
import { SITE_URL } from "@/lib/studio";
import "./globals.css";

// One superfamily in two widths, latin only, so the page preloads two small
// woff2 files. Encode Sans at normal width (400 and 500, which Google serves as
// one file) sets everything you read: body, buttons, labels, the legal pages.
const text = Encode_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-text",
});

// Its Expanded cut, one static weight, sets h1–h3 and the wordmark.
const display = Encode_Sans_Expanded({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  variable: "--font-encode",
});

export const metadata: Metadata = {
  // The origin only. File-based metadata (opengraph-image.jpg, icon.svg) already
  // carries the basePath in its URL, and Next joins it onto the base's path, so
  // SITE_URL's /hvnf-studios here would print /hvnf-studios/hvnf-studios/ on
  // GitHub Pages. A canonical or og:url added later should use SITE_URL itself.
  metadataBase: new URL("/", SITE_URL),
  title: {
    default: "HVNF Studios | Fast websites for local businesses",
    template: "%s | HVNF Studios",
  },
  description:
    "We’re a small studio making fast websites for auto shops, contractors, dentists and other local businesses. Try yours on your phone before you pay.",
  applicationName: "HVNF Studios",
  // The image comes from opengraph-image.jpg and its .alt.txt beside this file.
  openGraph: {
    title: "HVNF Studios | Fast websites for local businesses",
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
  themeColor: "#05080b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the head script below adds `js` and `data-lite` to
    // <html> before React hydrates, and the DOM's answer is the one we want kept.
    <html lang="en" className={`${text.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Runs while the HTML parses, before first paint (see device.ts), so lite
          devices never see a frame of the desktop treatment. page.tsx re-applies
          the live answer after hydration, which also covers resizes.
        */}
        <script dangerouslySetInnerHTML={{ __html: liteScript() }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
