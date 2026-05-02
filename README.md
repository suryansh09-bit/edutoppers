<div align="center">

<img src="./public/edutoppers-logo.png" alt="EduToppers Logo" width="120" height="120" style="border-radius:24px;" />

# EduToppers

### Free PW Learning Platform

**Premium Physics Wallah batches — completely free for every student.**
JEE · NEET · Class 10 · Class 12 · Foundation

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Telegram](https://img.shields.io/badge/Join-Telegram-2CA5E0?logo=telegram)](https://t.me/+4BMk346dLn1hZDU9)

</div>

---

## What is EduToppers?

EduToppers is a free online learning platform that provides students with access to high-quality PW (Physics Wallah) video lectures, notes, DPP (Daily Practice Problems), and live classes — at zero cost.

We believe quality education should be accessible to everyone, regardless of financial background. EduToppers bridges that gap.

---

## Features

| Feature | Description |
|---|---|
| 📚 **All PW Batches** | Browse and access every available PW batch |
| 🎬 **Video Lectures** | Watch lectures in a dedicated full-page player |
| 📡 **Live Classes** | Access recorded and live streaming classes |
| 📄 **Notes & DPP** | Download PDF notes and practice problems |
| 🛡️ **Verification Gate** | Cloudflare Turnstile human verification before playback |
| 🌐 **Responsive Design** | Fully optimised for mobile, tablet, and desktop |
| 🔒 **Secure** | Right-click protection, DevTools blocking, copy protection |

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **UI Library:** [React 19](https://react.dev)
- **Language:** [TypeScript 5](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com)
- **Video Players:** [Shaka Player](https://shaka-player-demo.appspot.com) (DRM/DASH) + [HLS.js](https://github.com/video-dev/hls.js) + Native HTML5
- **Verification:** [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm / yarn / pnpm / bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/edutoppers.git
cd edutoppers

# Install dependencies
npm install
# or
bun install
```

### Development

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Project Structure

```
edutoppers/
├── public/
│   ├── edutoppers-logo.png   # App logo
│   └── pw-logo.jpg           # PW branding asset
├── src/
│   ├── app/
│   │   ├── api/              # API routes (video-url, decrypt, live, etc.)
│   │   ├── batch/            # Batch → Subject → Topic pages
│   │   ├── watch/            # Dedicated video player page
│   │   ├── live/             # Dedicated live class player page
│   │   ├── layout.tsx        # Root layout with metadata & guards
│   │   └── page.tsx          # Home page (batch grid)
│   ├── components/
│   │   ├── VideoPlayer.tsx   # Full-featured video player (DRM/HLS/MP4)
│   │   ├── LiveVideoPlayer.tsx
│   │   ├── BatchGrid.tsx     # Home page hero + batch listing
│   │   ├── BatchCard.tsx     # Individual batch cards
│   │   ├── BatchTabs.tsx     # Subjects / Live / Faculty tabs
│   │   ├── TopicContent.tsx  # Lectures / Notes / DPP tabs
│   │   ├── Header.tsx        # Sticky navigation header
│   │   ├── TelegramPopup.tsx # Join channel popup
│   │   └── SiteGuard.tsx     # Security (right-click, devtools blocking)
│   └── lib/
│       └── types.ts          # Shared TypeScript types
```

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Click **Deploy** — Vercel auto-detects Next.js

### Other Platforms

Any platform supporting Node.js 18+ works:
- Railway
- Render
- Netlify (with Next.js plugin)

---

## Community & Support

> **Important:** This site may be taken down at any time. Join our Telegram channel to stay updated with the latest working link.

**Telegram Channel:** [https://t.me/+4BMk346dLn1hZDU9](https://t.me/+4BMk346dLn1hZDU9)

If a video fails to load, **retry 2–3 times** — it usually plays on the second or third attempt.
For persistent issues, contact **[@urs_boy09](https://t.me/urs_boy09)** on Telegram.

---

## Disclaimer

EduToppers is an independent, educational project. All course content belongs to their respective creators and platforms. This project is intended solely for educational access and is not affiliated with or endorsed by Physics Wallah (PW) or any related entity.

---

<div align="center">

Made with ❤️ for students everywhere

**[EduToppers](https://t.me/+4BMk346dLn1hZDU9)** · Free Education for All

</div>
