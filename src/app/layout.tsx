import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
