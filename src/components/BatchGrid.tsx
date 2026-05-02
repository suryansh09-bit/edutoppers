"use client";

import { useState } from "react";
import Image from "next/image";
import type { Batch } from "@/lib/types";
import BatchCard from "./BatchCard";
import SearchBar from "./SearchBar";

const PAGE_SIZE = 100;

export default function BatchGrid({ batches }: { batches: Batch[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = batches.filter((b) =>
    b.batchName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(0, page * PAGE_SIZE);

  return (
    <>
      {/* ── Hero ── */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-5 sm:mb-8 hero-bg">
        {/* Decorative blobs */}
        <div className="orb w-72 h-72 bg-white/10 -top-16 -left-16" />
        <div className="orb w-56 h-56 bg-violet-300/20 top-8 right-8" />
        <div className="orb w-40 h-40 bg-pink-300/20 bottom-0 left-1/3" />

        <div className="relative z-10 px-4 sm:px-10 lg:px-12 py-5 sm:py-10 lg:py-12 flex flex-row items-center justify-between gap-3 sm:gap-8">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="glass-hero inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-white/90 text-[10px] sm:text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                {batches.length} Premium Courses
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-1.5 sm:mb-3">
              Learn Smarter,<br />
              <span className="text-white/80">Achieve More</span>
            </h1>
            <p className="text-white/65 text-[11px] sm:text-sm font-medium leading-relaxed max-w-xs sm:max-w-sm hidden xs:block">
              Access premium PW batches — top-quality lectures, notes & live classes. 100% free.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-4">
              {["HD Lectures", "PDF Notes", "Live Classes", "DPP Practice"].map((f) => (
                <span key={f} className="glass-hero px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-white/85 text-[9px] sm:text-xs font-semibold">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Right: PW logo + stats */}
          <div className="flex flex-col items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* PW Logo */}
            <div className="glass-hero rounded-xl sm:rounded-3xl p-1.5 sm:p-3 shadow-xl shadow-black/30">
              <div className="w-12 h-12 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-lg sm:rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-lg">
                <Image
                  src="/pw-logo.jpg"
                  alt="Physics Wallah"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <p className="text-white/65 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-center mt-1">
                Physics Wallah
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-row gap-1 sm:gap-2.5">
              {[
                { label: "Courses", value: String(batches.length), color: "text-white" },
                { label: "Free", value: "100%", color: "text-emerald-300" },
              ].map((s) => (
                <div key={s.label} className="glass-hero px-2 sm:px-4 py-1 sm:py-2.5 rounded-lg sm:rounded-2xl flex flex-col items-center gap-0.5 min-w-[40px] sm:min-w-[70px]">
                  <div className={`font-black text-xs sm:text-base leading-none ${s.color}`}>{s.value}</div>
                  <div className="text-white/50 text-[8px] sm:text-[10px] font-medium uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature stripe ── */}
      <div className="stripe-bg rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 mb-6 sm:mb-8 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-3 sm:gap-6 flex-nowrap">
          {[
            { icon: "📺", text: "Video Lectures" },
            { icon: "📄", text: "PDF Notes" },
            { icon: "🔴", text: "Live Sessions" },
            { icon: "📋", text: "DPP Sheets" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="text-sm sm:text-base">{item.icon}</span>
              <span className="text-slate-600 text-xs sm:text-sm font-semibold whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-indigo-600 text-xs sm:text-sm font-bold flex-shrink-0">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          All Free
        </div>
      </div>

      {/* ── Search + count row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">All Batches</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Showing{" "}
            <span className="font-bold text-indigo-600">{paginated.length}</span>{" "}
            of{" "}
            <span className="font-bold text-slate-600">{filtered.length}</span>{" "}
            batches
          </p>
        </div>
        <div className="w-full sm:w-80">
          <SearchBar
            onSearch={(q) => {
              setSearch(q);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── Grid ── */}
      {paginated.length === 0 ? (
        <div className="text-center py-28 animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-slate-800 font-bold text-xl mb-2">No results found</h3>
          <p className="text-slate-400 text-sm">Try a different keyword or browse all courses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-up">
          {paginated.map((batch, i) => (
            <div
              key={batch.batchId}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <BatchCard batch={batch} />
            </div>
          ))}
        </div>
      )}

      {/* ── Load more ── */}
      {page < totalPages && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="btn-primary px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Load More
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {filtered.length - paginated.length} left
            </span>
          </button>
        </div>
      )}
    </>
  );
}
