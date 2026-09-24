import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { AnalyticsTracker } from "@/components/layout/analytics-tracker";
import { themeInitScript } from "@/components/layout/theme-toggle";
import { site } from "@/config/site";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "./fonts/inter-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/inter-latin-ext-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Relevéo — Relevé bancaire PDF en Excel, CSV ou OFX, vérifié au centime",
    template: "%s — Relevéo",
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    url: "/",
    title: "Relevéo — Vos relevés bancaires PDF, convertis et vérifiés au centime",
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;
  const plausibleSrc = process.env.PLAUSIBLE_SRC ?? "/js/script.js";
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <AnalyticsTracker />
        {plausibleDomain ? <Script defer data-domain={plausibleDomain} src={plausibleSrc} strategy="afterInteractive" /> : null}
      </body>
    </html>
  );
}
