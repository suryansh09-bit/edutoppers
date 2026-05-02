import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramPopup from "@/components/TelegramPopup";
import SiteGuard from "@/components/SiteGuard";

export const metadata: Metadata = {
  title: {
    default: "EduToppers — Free PW Learning Platform",
    template: "%s | EduToppers",
  },
  description:
    "EduToppers gives every student free access to premium Physics Wallah (PW) batches — JEE, NEET, Class 10/12 and more. Study smarter, score higher.",
  keywords: [
    "EduToppers",
    "PW free batches",
    "Physics Wallah free",
    "JEE free study",
    "NEET free study",
    "free learning platform",
    "PW batches",
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
    title: "EduToppers — Free PW Learning Platform",
    description:
      "Premium PW batches, free for every student. Unlock quality education today.",
    images: [{ url: "/edutoppers-logo.png", width: 512, height: 512, alt: "EduToppers Logo" }],
  },
  twitter: {
    card: "summary",
    title: "EduToppers — Free PW Learning Platform",
    description: "Premium PW batches, free for every student.",
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
