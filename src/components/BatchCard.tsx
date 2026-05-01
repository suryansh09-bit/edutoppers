"use client";

import Link from "next/link";
import Image from "next/image";
import type { Batch } from "@/lib/types";

const COLORS = [
  { from: "#6366f1", to: "#8b5cf6", bg: "#eef2ff", text: "#4338ca" },
  { from: "#ec4899", to: "#f43f5e", bg: "#fdf2f8", text: "#9d174d" },
  { from: "#10b981", to: "#059669", bg: "#ecfdf5", text: "#065f46" },
  { from: "#f59e0b", to: "#ef4444", bg: "#fffbeb", text: "#92400e" },
  { from: "#3b82f6", to: "#6366f1", bg: "#eff6ff", text: "#1e40af" },
  { from: "#8b5cf6", to: "#ec4899", bg: "#f5f3ff", text: "#5b21b6" },
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "PW";
}

export default function BatchCard({ batch }: { batch: Batch }) {
  const color = getColor(batch.batchName);
  const initials = getInitials(batch.batchName);

  return (
    <Link href={`/batch/${batch.batchId}`} className="block group">
      <div className="card-gradient rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden">
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
              style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
            >
              <span className="text-4xl font-black text-white/90 tracking-tight">{initials}</span>
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
              <svg className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Active badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 backdrop-blur-sm text-emerald-700 text-[10px] font-bold shadow-sm border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ACTIVE
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-indigo-700 transition-colors">
            {batch.batchName}
          </h3>
          <div className="mt-auto flex items-center justify-between">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: color.bg, color: color.text }}
            >
              PW Batch
            </span>
            <span className="flex items-center gap-1 text-indigo-500 text-xs font-medium group-hover:gap-2 transition-all">
              View
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
