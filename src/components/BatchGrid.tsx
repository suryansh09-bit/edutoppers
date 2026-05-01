"use client";

import { useState } from "react";
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
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-10 hero-gradient p-8 sm:p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(ellipse at 20% 50%,#fff 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#fff 0%,transparent 50%)" }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="stat-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {batches.length} Courses Available
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2">
              Unlock Free Learning
            </h1>
            <p className="text-white/75 text-sm sm:text-base font-medium max-w-sm">
              Premium PW batches — completely free. Start learning today.
            </p>
          </div>
          <div className="flex gap-3">
            {[
              { icon: "🎓", label: "Batches", value: String(batches.length) },
              { icon: "✅", label: "Free", value: "100%" },
            ].map((s) => (
              <div key={s.label} className="stat-pill px-4 py-3 rounded-2xl text-center min-w-[80px]">
                <div className="text-xl mb-0.5">{s.icon}</div>
                <div className="text-white font-black text-lg leading-none">{s.value}</div>
                <div className="text-white/60 text-[10px] font-medium mt-0.5 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Count Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">All Batches</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Showing <span className="font-semibold text-indigo-600">{paginated.length}</span> of{" "}
            <span className="font-semibold">{filtered.length}</span> batches
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

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-slate-700 font-semibold text-lg mb-1">No results found</h3>
          <p className="text-slate-400 text-sm">Try a different keyword</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-up">
          {paginated.map((batch) => (
            <BatchCard key={batch.batchId} batch={batch} />
          ))}
        </div>
      )}

      {page < totalPages && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="btn-purple text-white px-8 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2"
          >
            Load More
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {filtered.length - paginated.length} remaining
            </span>
          </button>
        </div>
      )}
    </>
  );
}
