import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramPopup from "@/components/TelegramPopup";
import SiteGuard from "@/components/SiteGuard";

export const metadata: Metadata = {
  title: {
    default: "EduToppers — India's Best Free Learning Platform",
    template: "%s | EduToppers",
  },
  description:
    "EduToppers is India's leading free online education platform. Access top-quality video lectures, notes, DPP and live classes for JEE, NEET, Class 10 & 12 — absolutely free. Learn from the best teachers and crack your exams with confidence.",
  keywords: [
    "EduToppers",
    "free online classes",
    "JEE preparation",
    "NEET preparation",
    "Class 10 online classes",
    "Class 12 online classes",
    "free video lectures",
    "online study platform India",
    "PW batches free",
    "free DPP notes",
  ],
  authors: [{ name: "EduToppers Team" }],
  creator: "EduToppers",
  publisher: "EduToppers",
  applicationName: "EduToppers",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/edutoppers-logo.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/edutoppers-logo.png",
    shortcut: "/edutoppers-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "EduToppers",
    title: "EduToppers — India's Best Free Learning Platform",
    description:
      "Access top-quality video lectures, notes, DPP and live classes for JEE, NEET, Class 10 & 12 — absolutely free.",
    images: [{ url: "/edutoppers-logo.png", width: 512, height: 512, alt: "EduToppers Logo" }],
  },
  twitter: {
    card: "summary",
    title: "EduToppers — India's Best Free Learning Platform",
    description:
      "Access top-quality video lectures, notes, DPP and live classes for JEE, NEET — absolutely free.",
    images: ["/edutoppers-logo.png"],
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/* Cloudflare Turnstile script — loaded for the video verification gate */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
        {/* Global copy/select protection */}
        <style>{`
          *:not(input):not(textarea):not([contenteditable]) {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            user-select: none !important;
          }
          input, textarea, [contenteditable] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            user-select: text !important;
          }
        `}</style>
      </head>
      <body className="min-h-screen">
        <SiteGuard />
        {children}
        <TelegramPopup />
      </body>
    </html>
  );
}
