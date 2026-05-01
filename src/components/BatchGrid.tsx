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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-accent-purple rounded-full" />
          <h1 className="text-3xl font-bold text-white">PW Batches</h1>
          <span className="flex items-center gap-1 text-accent-green text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            LIVE
          </span>
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

      <p className="text-text-secondary text-sm mb-6">
        Showing {paginated.length} of {filtered.length} batches
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.map((batch) => (
          <BatchCard key={batch.batchId} batch={batch} />
        ))}
      </div>

      {page < totalPages && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="btn-purple text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            Load More ({filtered.length - paginated.length} remaining)
          </button>
        </div>
      )}
    </>
  );
}
