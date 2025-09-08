/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import React, { useEffect } from "react";

/* Helpers kept local to avoid cross-file coupling */
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
function atLocalMidnight(d = new Date()) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
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
  // Seed today's date by default so dependent sections can render
  useEffect(() => {
    const hasFrom = Boolean(selectedDateRange?.from);
    const hasTo = Boolean(selectedDateRange?.to);
    if (!hasFrom || !hasTo) {
      const today = atLocalMidnight();
      setSelectedDateRange({ from: today, to: today });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once to avoid loops

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
    setSelectedDateRange(next); // live filtering (unchanged outputs)
  }

  // Improve dual-range interaction:
  // bring the "closer" thumbs to front when near to avoid one blocking the other.
  const closeTogether = (priceRange?.max ?? MAX) - (priceRange?.min ?? MIN) <= STEP * 2;
  const minZ = closeTogether ? 40 : 20;
  const maxZ = closeTogether ? 20 : 40;

  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white shadow-md ${className}`}
      role="search"
      aria-label="Filter venues"
    >
      <div className="grid grid-cols-12 gap-4 items-end p-4">
        {/* Location */}
        <div className="col-span-12 md:col-span-3">
          <label htmlFor="filter-location-input" className="block text-xs text-gray-800 mb-1">
            Location
          </label>
          <input
            id="filter-location-input"
            type="text"
            placeholder="City, country, zip…"
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            value={selectedPlace ?? ""}
            onChange={(e) => setSelectedPlace(e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="col-span-6 md:col-span-2">
          <label htmlFor="filter-date-from" className="block text-xs text-gray-800 mb-1">
            From
          </label>
          <input
            id="filter-date-from"
            type="date"
            min={minStr}
            value={fromVal}
            onChange={(e) => onDateChange("from", e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-2 py-2 text-sm text-gray-900
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label htmlFor="filter-date-to" className="block text-xs text-gray-800 mb-1">
            To
          </label>
          <input
            id="filter-date-to"
            type="date"
            min={fromVal || minStr}
            value={toVal}
            onChange={(e) => onDateChange("to", e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-2 py-2 text-sm text-gray-900
                       focus:outline-none focus-visible:ring-2
                       focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          />
        </div>

        {/* Price Range (dual range + numeric inputs) */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-xs text-gray-800 mb-1">Price range</label>

          {/* Slider */}
          <div className="relative select-none rounded-full bg-slate-200 h-1.5 mb-3">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-full rounded-full bg-[color:var(--color-brand-600)]"
              style={{
                left: `${((priceRange?.min ?? MIN) / MAX) * 100}%`,
                width: `${(((priceRange?.max ?? MAX) - (priceRange?.min ?? MIN)) / MAX) * 100}%`,
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
                setPriceRange({
                  ...priceRange,
                  min: Math.min(Number(e.target.value), priceRange.max - STEP),
                })
              }
              className="absolute inset-0 appearance-none bg-transparent
                         focus:z-[50]
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/10
                         [&::-webkit-slider-thumb]:bg-[color:var(--color-brand-700)] [&::-webkit-slider-thumb]:shadow
                         [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/10
                         [&::-moz-range-thumb]:bg-[color:var(--color-brand-700)]"
              style={{ zIndex: minZ }}
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
                setPriceRange({
                  ...priceRange,
                  max: Math.max(Number(e.target.value), priceRange.min + STEP),
                })
              }
              className="absolute inset-0 appearance-none bg-transparent
                         focus:z-[50]
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/10
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow
                         [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/10
                         [&::-moz-range-thumb]:bg-white"
              style={{ zIndex: maxZ }}
              aria-label="Maximum price"
            />
          </div>

          {/* Numeric inputs */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-800">Min</span>
              <input
                type="number"
                value={priceRange.min}
                min={MIN}
                max={priceRange.max - STEP}
                step={STEP}
                onChange={(e) =>
                  setPriceRange({
                    ...priceRange,
                    min: Math.min(Number(e.target.value) || MIN, priceRange.max - STEP),
                  })
                }
                className="w-24 rounded-md border border-gray-400 bg-white px-2 py-2 text-sm font-semibold text-gray-900
                           focus:ring-2 focus:ring-[color:var(--color-brand-600)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-800">Max</span>
              <input
                type="number"
                value={priceRange.max}
                min={priceRange.min + STEP}
                max={MAX}
                step={STEP}
                onChange={(e) =>
                  setPriceRange({
                    ...priceRange,
                    max: Math.max(Number(e.target.value) || MAX, priceRange.min + STEP),
                  })
                }
                className="w-24 rounded-md border border-gray-400 bg-white px-2 py-2 text-sm font-semibold text-gray-900
                           focus:ring-2 focus:ring-[color:var(--color-brand-600)]"
              />
            </div>
          </div>
        </div>

        {/* Amenities inline (wraps if needed) */}
        <div className="col-span-12">
          <div className="flex flex-wrap items-center gap-6 mt-2">
            {[
              ["wifi", "Wi-Fi"],
              ["parking", "Parking"],
              ["breakfast", "Breakfast"],
              ["pets", "Pets allowed"],
            ].map(([key, label]) => {
              const id = `amenity-${key}`;
              const checked = !!metaFilters?.[key];
              return (
                <label key={key} htmlFor={id} className="inline-flex items-center cursor-pointer select-none">
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
                  <span className="ml-2 text-sm text-gray-900">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-12 pt-1 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium
                       hover:bg-black/[.03] transition
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
