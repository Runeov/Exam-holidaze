// src/components/SearchBar.jsx
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookingCalendar from "./BookingCalendar";

function toIsoZMidnight(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString();
}

function fmtShort(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SearchBar({ initialQuery = "" }) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState({ from: null, to: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Prefill from Home (e.g., selected place from carousel)
  useEffect(() => {
    if (typeof initialQuery === "string") setQuery(initialQuery);
  }, [initialQuery]);

  // Close calendar when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hasDates = Boolean(range?.from && range?.to);
  const datesLabel = hasDates ? `${fmtShort(range.from)} → ${fmtShort(range.to)}` : "Dates";

  function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set("q", q);
    if (range.from) params.set("dateFrom", toIsoZMidnight(range.from));
    if (range.to) params.set("dateTo", toIsoZMidnight(range.to));
    const qs = params.toString();
    navigate(qs ? `/venues?${qs}` : "/venues");
    setCalendarOpen(false);
  }

  return (
    <div ref={wrapperRef} className="w-full">
      <form
        role="search"
        onSubmit={onSubmit}
        className="flex items-stretch gap-2 rounded-full border border-black/10 bg-surface p-2 shadow-sm"
      >
        {/* Query input */}
        <label className="sr-only" htmlFor="sb-q">
          Where do you want to stay?
        </label>
        <input
          id="sb-q"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where to?"
          className="flex-1 rounded-full px-4 py-2 outline-none bg-transparent
                     text-white caret-white placeholder:text-text-muted
                     focus-visible:ring-2 focus-visible:ring-brand-600
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        />

        {/* Dates toggle */}
        <button
          type="button"
          aria-expanded={calendarOpen}
          aria-controls="sb-calendar"
          onClick={() => setCalendarOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setCalendarOpen((v) => !v);
            }
          }}
          className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.03]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {datesLabel}
        </button>

        {/* Clear dates */}
        {hasDates && (
          <button
            type="button"
            onClick={() => setRange({ from: null, to: null })}
            className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.03]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Clear
          </button>
        )}

        {/* Submit */}
        <button
          type="submit"
          aria-label="Search"
          className="px-4 py-2 text-sm font-medium text-[--color-text] bg-[--color-brand-500] hover:bg-[--color-brand-700]
             rounded-[var(--radius-md)] transition shadow-sm
             focus:outline-none focus-visible:ring-2 ring-[--color-brand-500] ring-offset-2 ring-offset-white
             disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </form>

      {/* Calendar popover */}
      {calendarOpen && (
        <div
          id="sb-calendar"
          className="relative z-20 mt-2 w-full rounded-xl border border-black/10 bg-surface p-3 shadow-md"
        >
          <BookingCalendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-black/10 px-3 py-2 hover:bg-black/[.03]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              onClick={() => setCalendarOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
