// src/components/FilterPanelCard.jsx
import React from "react";
import CalendarDropdown from "./CalendarDropdown"; // keep your existing path

export default function FilterPanelCard({
  open,                   // boolean: control visibility (e.g., from "Show more" button)
  onClose,                // optional: close handler (if you want a Close button)
  selectedDateRange,
  setSelectedDateRange,
  tempDateRange,
  setTempDateRange,
  priceRange,
  setPriceRange,
  metaFilters,
  setMetaFilters,
  selectedPlace,
  setSelectedPlace,
  minDate = new Date(),
  className = "",         // optional: extra classes for positioning (absolute, centered, etc.)
}) {
  if (!open) return null;

  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white p-4 md:p-6 shadow-lg ${className}`}
      role="dialog"
      aria-label="Filter venues"
    >
      {/* Keep your original inner block untouched for animation */}
      <div className="mt-8 text-left transition-opacity duration-300">
        <CalendarDropdown
          selected={tempDateRange}
          onChange={setTempDateRange}
          onApply={(range) => {
            setSelectedDateRange(range);
            if (typeof onClose === "function") onClose();
          }}
          onPriceRangeChange={setPriceRange}
          onMetaFilterChange={setMetaFilters}
          onLocationChange={setSelectedPlace}
          minDate={minDate}
        />

        <div className="mt-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (tempDateRange?.from && tempDateRange?.to) {
                setSelectedDateRange(tempDateRange);
                if (typeof onClose === "function") onClose();
              }
            }}
            disabled={!tempDateRange?.from || !tempDateRange?.to}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold
                       rounded-full border border-[var(--color-brand-600)]
                       bg-[var(--color-brand-600)] text-white shadow-sm
                       hover:bg-[var(--color-brand-700)] hover:shadow-md active:scale-95 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>

          {typeof onClose === "function" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium
                         hover:bg-black/[.03] transition
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
