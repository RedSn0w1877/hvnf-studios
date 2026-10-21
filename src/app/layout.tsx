import type { Metadata, Viewport } from "next";
import { Encode_Sans_Expanded } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { liteScript } from "@/lib/device";
import { SITE_URL } from "@/lib/studio";
import "./globals.css";

// The one added family: a single static weight in latin only, so it ships as one
// small preloaded woff2. It sets h1–h3 and the wordmark; Geist does everything else.
const display = Encode_Sans_Expanded({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  variable: "--font-encode",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HVNF Studios — fast bespoke websites for local business",
    template: "%s — HVNF Studios",
  },
  description:
    "We replace slow, dated websites for trades, clinics, salons and shops with hand-built ones: mobile first, quick to load, and wired to capture calls and bookings.",
  applicationName: "HVNF Studios",
  openGraph: {
    title: "HVNF Studios — fast bespoke websites for local business",
    description:
      "Hand-built websites for local business: mobile first, quick to load, and wired to capture calls and bookings.",
    type: "website",
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
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}
      suppressHydrationWarning
    >
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
