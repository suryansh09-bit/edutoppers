import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramPopup from "@/components/TelegramPopup";
import SiteGuard from "@/components/SiteGuard";

export const metadata: Metadata = {
  title: {
    default: "Free Physics Wallah Batches at One Place — EduToppers",
    template: "%s | EduToppers",
  },
  description:
    "Free Physics Wallah Batches at One Place — EduToppers. Physics Wallah (PW) is an Indian edtech platform that provides accessible & comprehensive learning experiences to students from Class 6th to postgraduate level. Access free PW batches with live classes and high quality lectures for every student.",
  keywords: [
    "Physics Wallah free batches",
    "PW free courses",
    "Physics Wallah live classes",
    "free PW batches",
    "Physics Wallah Class 6 to postgraduate",
    "EduToppers",
    "free JEE NEET classes",
    "PW lectures free",
    "Physics Wallah edtech India",
    "free online education India",
    "PW notes DPP free",
    "high quality free lectures",
  ],
  authors: [{ name: "EduToppers Team" }],
  creator: "EduToppers",
  publisher: "EduToppers",
  applicationName: "EduToppers",
  icons: {
    icon: [
      { url: "/edutoppers-logo.png", type: "image/png", sizes: "any" },
    ],
    apple: "/edutoppers-logo.png",
    shortcut: "/edutoppers-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "EduToppers",
    title: "Free Physics Wallah Batches at One Place — EduToppers",
    description:
      "Physics Wallah (PW) is an Indian edtech platform providing comprehensive learning from Class 6th to postgraduate level. Get free PW batches with live classes and high quality lectures.",
    images: [{ url: "/edutoppers-logo.png", width: 512, height: 512, alt: "EduToppers Logo" }],
  },
  twitter: {
    card: "summary",
    title: "Free Physics Wallah Batches at One Place — EduToppers",
    description:
      "Physics Wallah (PW) is an Indian edtech platform. EduToppers provides free PW batches with live classes and high quality lectures for every student.",
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
        {/* Favicon — explicit tags override any Next.js defaults */}
        <link rel="icon" type="image/png" href="/edutoppers-logo.png" />
        <link rel="shortcut icon" href="/edutoppers-logo.png" />
        <link rel="apple-touch-icon" href="/edutoppers-logo.png" />
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
