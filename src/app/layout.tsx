import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SITE_URL } from "@/lib/studio";
import "./globals.css";

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
  themeColor: "#07090d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
