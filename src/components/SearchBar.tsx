"use client";

import { useState, useTransition } from "react";

export default function SearchBar({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div className="relative">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search batches..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          startTransition(() => onSearch(e.target.value));
        }}
        className="w-full pl-12 pr-4 py-3 bg-bg-card border border-border-color rounded-xl text-white placeholder-text-secondary focus:outline-none focus:border-accent-purple transition-colors"
      />
    </div>
  );
}
