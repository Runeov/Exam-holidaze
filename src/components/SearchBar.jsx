/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ initialQuery = "" }) {
  const [q, setQ] = useState(initialQuery);
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    const query = (q || "").trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    // Force owner expansion in the API
    params.set("_owner", "true");
    navigate(`/venues?${params.toString()}`);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex items-center gap-2 rounded-full border border-black/10 bg-surface p-2 shadow-sm"
    >
      <label htmlFor="sb-q" className="sr-only">
        Search venues
      </label>
      <input
        id="sb-q"
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, location or owner…"
        className="flex-1 rounded-full px-4 py-2 outline-none bg-transparent
                   text-[--color-text] placeholder:text-text-muted
                   focus-visible:ring-2 focus-visible:ring-brand-600
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      />
      <button
        type="submit"
        aria-label="Search"
        className="px-4 py-2 text-sm font-medium text-[--color-text]
                   bg-[--color-brand-500] hover:bg-[--color-brand-700]
                   rounded-[var(--radius-md)] transition shadow-sm
                   focus:outline-none focus-visible:ring-2 ring-[--color-brand-500]
                   ring-offset-2 ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Search
      </button>
    </form>
  );
}
