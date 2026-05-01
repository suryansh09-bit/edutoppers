"use client";

import Link from "next/link";
import Image from "next/image";
import type { Batch } from "@/lib/types";

const PALETTES = [
  { from: "#6366f1", to: "#8b5cf6", badge: "#e0e7ff", badgeText: "#3730a3" },
  { from: "#ec4899", to: "#f43f5e", badge: "#ffe4e6", badgeText: "#9f1239" },
  { from: "#10b981", to: "#059669", badge: "#dcfce7", badgeText: "#166534" },
  { from: "#f59e0b", to: "#ef4444", badge: "#fef3c7", badgeText: "#92400e" },
  { from: "#0ea5e9", to: "#6366f1", badge: "#e0f2fe", badgeText: "#075985" },
  { from: "#8b5cf6", to: "#ec4899", badge: "#f5f3ff", badgeText: "#5b21b6" },
];

function getPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "PW";
}

export default function BatchCard({ batch }: { batch: Batch }) {
  const p = getPalette(batch.batchName);
  const initials = getInitials(batch.batchName);

  return (
    <Link href={`/batch/${batch.batchId}`} className="block group h-full">
      <div className="card rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden bg-slate-100">
          {batch.batchImage ? (
            <Image
              src={batch.batchImage}
              alt={batch.batchName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
                  backgroundSize: "24px 24px"
                }}
              />
              <span className="relative text-4xl font-black text-white/90 tracking-tight drop-shadow-md">{initials}</span>
            </div>
          )}

          {/* Hover play */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-indigo-700 text-xs font-bold">View Batch</span>
            </div>
          </div>

          {/* Active badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-emerald-700 text-[10px] font-bold shadow-sm border border-emerald-100/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ACTIVE
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-900 text-[13px] leading-snug line-clamp-2 mb-3 group-hover:text-indigo-700 transition-colors">
            {batch.batchName}
          </h3>

          <div className="mt-auto flex items-center justify-between">
            <span
              className="cat-pill"
              style={{ background: p.badge, color: p.badgeText }}
            >
              PW Batch
            </span>
            <span className="flex items-center gap-1 text-indigo-500 text-xs font-bold group-hover:text-indigo-700 group-hover:gap-1.5 transition-all">
              Explore
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
