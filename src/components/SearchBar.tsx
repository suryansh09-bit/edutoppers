"use client";

import { useState, useTransition } from "react";

export default function SearchBar({
  onSearch,
  placeholder = "Search batches...",
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          startTransition(() => onSearch(e.target.value));
        }}
        className="search-input w-full pl-11 pr-10 py-3 rounded-xl text-sm font-semibold"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); startTransition(() => onSearch("")); }}
          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
