import React from "react";

function toInputDate(d) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (!(dt instanceof Date) || Number.isNaN(+dt)) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromInputDate(s) {
  if (!s) return undefined;
  const dt = new Date(s + "T00:00:00");
  return Number.isNaN(+dt) ? undefined : dt;
}

export default function FilterPanelCard({
  open,
  onClose, // optional
  selectedDateRange,      // {from?: Date, to?: Date}
  setSelectedDateRange,
  priceRange,             // {min:number, max:number}
  setPriceRange,
  metaFilters,            // {wifi:boolean, parking:boolean, breakfast:boolean, pets:boolean}
  setMetaFilters,
  selectedPlace,          // string
  setSelectedPlace,
  minDate = new Date(),
  className = "",
}) {
  if (!open) return null;

  const MIN = 0;
  const MAX = 10000;
  const STEP = 50;

  const minStr = toInputDate(minDate);
  const fromVal = toInputDate(selectedDateRange?.from);
  const toVal = toInputDate(selectedDateRange?.to);

  function onDateChange(which, value) {
    const next = {
      from: which === "from" ? fromInputDate(value) : selectedDateRange?.from,
      to: which === "to" ? fromInputDate(value) : selectedDateRange?.to,
    };
    setSelectedDateRange(next); // live filtering (unchanged)
  }

  return (
    <div
      className={[
        "form-card",
        "rounded-2xl border border-black/10 bg-[color:var(--color-brand-50)]/40",
        "shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-brand-50)]/50",
        "p-4 md:p-6 space-y-4 md:space-y-6",
        className,
      ].join(" ")}
      role="search"
      aria-label="Filter venues"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full
                       bg-[color:var(--color-brand-500)] text-white shadow"
          >
            {/* funnel icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
            </svg>
          </span>
          <h3 className="text-base md:text-lg font-semibold text-[color:var(--color-brand-900)]">
            Filters
          </h3>
        </div>
        {typeof onClose === "function" && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium
                       hover:bg-black/[.03] transition
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label="Close filters"
            title="Close"
          >
            Close
          </button>
        )}
      </div>

      <hr className="border-t border-black/10" />

      {/* Grid */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 items-end">
        {/* Location */}
        <div className="col-span-12 md:col-span-4">
          <label className="block text-xs text-gray-600 mb-1">Location</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              {/* location pin */}
              <svg width="16" height="16" viewBox="0 0 24 24" className="text-gray-500" fill="currentColor" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="City, country, zip…"
              className="w-full rounded-lg border border-black/10 bg-white pl-9 pr-3 py-2 text-sm
                         focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              value={selectedPlace ?? ""}
              onChange={(e) => setSelectedPlace(e.target.value)}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="col-span-6 md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
              {/* calendar */}
              <svg width="14" height="14" viewBox="0 0 24 24" className="text-gray-500" fill="currentColor" aria-hidden="true">
                <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm13 7H6v11h14V9z"/>
              </svg>
            </span>
            <input
              type="date"
              min={minStr}
              value={fromVal}
              onChange={(e) => onDateChange("from", e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white pl-7 pr-2 py-2 text-sm
                         focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            />
          </div>
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" className="text-gray-500" fill="currentColor" aria-hidden="true">
                <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm13 7H6v11h14V9z"/>
              </svg>
            </span>
            <input
              type="date"
              min={fromVal || minStr}
              value={toVal}
              onChange={(e) => onDateChange("to", e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white pl-7 pr-2 py-2 text-sm
                         focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="col-span-12 md:col-span-4">
          <label className="block text-xs text-gray-600 mb-1">Price range</label>

          {/* Track */}
          <div className="relative select-none rounded-full bg-slate-200 h-1.5 mb-3">
            <div
              className="absolute h-full rounded-full bg-[color:var(--color-brand-600)]"
              style={{
                left: `${(priceRange.min / MAX) * 100}%`,
                width: `${((priceRange.max - priceRange.min) / MAX) * 100}%`,
              }}
            />
            {/* Min thumb */}
            <input
              type="range"
              min={MIN}
              max={MAX}
              step={STEP}
              value={priceRange.min}
              onChange={(e) =>
                setPriceRange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max - STEP) })
              }
              className="absolute inset-0 h-1.5 w-full appearance-none bg-transparent
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/10
                         [&::-webkit-slider-thumb]:bg-[color:var(--color-brand-700)] [&::-webkit-slider-thumb]:shadow
                         [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/10
                         [&::-moz-range-thumb]:bg-[color:var(--color-brand-700)]"
              aria-label="Minimum price"
            />
            {/* Max thumb */}
            <input
              type="range"
              min={MIN}
              max={MAX}
              step={STEP}
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min + STEP) })
              }
              className="absolute inset-0 h-1.5 w-full appearance-none bg-transparent
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/10
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow
                         [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/10
                         [&::-moz-range-thumb]:bg-white"
              aria-label="Maximum price"
            />
          </div>

          {/* Numeric display */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Min</span>
              <input
                type="number"
                value={priceRange.min}
                min={MIN}
                max={priceRange.max - STEP}
                step={STEP}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: Math.min(Number(e.target.value) || MIN, priceRange.max - STEP) })
                }
                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800
                           focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Max</span>
              <input
                type="number"
                value={priceRange.max}
                min={priceRange.min + STEP}
                max={MAX}
                step={STEP}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: Math.max(Number(e.target.value) || MAX, priceRange.min + STEP) })
                }
                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800
                           focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="col-span-12">
          <label className="block text-xs text-gray-600 mb-1">Amenities</label>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {[
              ["wifi", "Wi-Fi"],
              ["parking", "Parking"],
              ["breakfast", "Breakfast"],
              ["pets", "Pets allowed"],
            ].map(([key, label]) => {
              const id = `amenity-${key}`;
              const checked = !!metaFilters?.[key];
              return (
                <label key={key} htmlFor={id} className="relative inline-flex items-center cursor-pointer select-none">
                  <span className="relative">
                    <input
                      id={id}
                      type="checkbox"
                      className="sr-only peer"
                      checked={checked}
                      onChange={(e) => setMetaFilters((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                    {/* Track */}
                    <span
                      className="block w-11 h-6 rounded-full bg-gray-200 border border-black/10
                                 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[color:var(--color-brand-300)]
                                 peer-checked:bg-[color:var(--color-brand-600)]"
                    />
                    {/* Thumb */}
                    <span
                      className="absolute top-0.5 left-[2px] w-5 h-5 rounded-full bg-white border border-gray-300
                                 transition-all duration-300 ease-in-out shadow
                                 peer-checked:translate-x-[22px] peer-checked:border-white"
                    />
                  </span>
                  <span className="ml-2 text-sm">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer divider */}
      <hr className="border-t border-black/10" />

      {/* Footer actions (Close only, Apply not needed for live filters) */}
      <div className="flex justify-end">
        {typeof onClose === "function" && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium
                       hover:bg-black/[.03] transition
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}