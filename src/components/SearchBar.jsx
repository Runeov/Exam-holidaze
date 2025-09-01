// components/SearchBar.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandedCalendar from "./BrandedCalendar";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState({ from: null, to: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // 🧽 Click outside to close calendar
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔎 Handle submit
  function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (range.from && range.to) {
      params.set("dateFrom", range.from.toISOString().slice(0, 10));
      params.set("dateTo", range.to.toISOString().slice(0, 10));
    }
    navigate(`/venues?${params.toString()}`);
  }

  // 📅 Formatted date range
  const formattedDate =
    range.from && range.to
      ? `${range.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${range.to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : "When";

  return (
    <form onSubmit={onSubmit} ref={wrapperRef} className="relative max-w-[720px] mx-auto">
      <div className="flex items-center gap-3 bg-surface rounded-full px-4 py-3 shadow ring-1 ring-black/10 backdrop-blur transition-all">
        {/* WHERE */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Where are you going?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
          />
        </div>

        {/* WHEN (toggle calendar) */}
        <button
          type="button"
          onClick={() => setCalendarOpen((o) => !o)}
          className="text-sm text-text-muted hover:text-text transition"
        >
          📅 {formattedDate}
        </button>

        {/* SEARCH */}
        <button
          type="submit"
          className="ml-2 grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
          aria-label="Search"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path stroke="currentColor" strokeWidth="2" d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </div>

      {/* CALENDAR POPOVER */}
      {calendarOpen && (
        <div className="absolute top-full left-0 mt-2 z-30 w-full max-w-[720px]">
          <BrandedCalendar
            selected={range}
            onSelect={(next) => {
              setRange(next || { from: null, to: null });
              setCalendarOpen(false);
            }}
            minDate={new Date()}
            bookings={[]} // Ready for real-time integration
          />
        </div>
      )}
    </form>
  );
}
