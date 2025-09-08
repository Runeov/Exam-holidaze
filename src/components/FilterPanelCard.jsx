// src/components/FilterPanelCard.jsx
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
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
    setSelectedDateRange(next); // live filtering
  }

  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white shadow-md ${className}`}
      role="search"
      aria-label="Filter venues"
    >
      <div className="grid grid-cols-12 gap-4 items-end p-4">
        {/* Location */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-xs text-gray-600 mb-1">Location</label>
          <input
            type="text"
            placeholder="City, country, zip…"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            value={selectedPlace ?? ""}
            onChange={(e) => setSelectedPlace(e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="col-span-6 md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            min={minStr}
            value={fromVal}
            onChange={(e) => onDateChange("from", e.target.value)}
            className="w-full rounded-md border border-black/10 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            min={fromVal || minStr}
            value={toVal}
            onChange={(e) => onDateChange("to", e.target.value)}
            className="w-full rounded-md border border-black/10 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        {/* Price Range (dual range + visible numeric inputs) */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-xs text-gray-600 mb-1">Price range</label>

          {/* Slider (two inputs stacked using the track color as active range) */}
          <div className="relative select-none rounded-full bg-slate-200 h-1 mb-3">
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
              className="absolute top-0 h-1 w-full appearance-none bg-transparent
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--color-brand-700)]
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[color:var(--color-brand-700)]
                         [&::-moz-range-thumb]:cursor-pointer"
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
              className="absolute top-0 h-1 w-full appearance-none bg-transparent
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--color-brand-700)]
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[color:var(--color-brand-700)]
                         [&::-moz-range-thumb]:cursor-pointer"
              aria-label="Maximum price"
            />
          </div>

          {/* Numeric inputs (bold/visible) */}
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
                className="w-24 rounded-md border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-brand-600"
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
                className="w-24 rounded-md border border-gray-400 px-2 py-2 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>
        </div>

        {/* Amenities inline (one line, wraps if needed) */}
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
                                 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-brand-300)]
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
    </div>
  );
}
