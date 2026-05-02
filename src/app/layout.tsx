import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramPopup from "@/components/TelegramPopup";
import SiteGuard from "@/components/SiteGuard";

export const metadata: Metadata = {
  title: "EduToppers — Free Learning Platform",
  description: "Premium PW batches free for every student. Unlock quality education today.",
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
