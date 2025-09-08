/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import React from "react";
import { DayPicker } from "react-day-picker";

/** Small util for friendly date labels */
function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * FilterPanelCard (inline, no CalendarDropdown wrapper)
 * Props are unchanged from previous version for drop-in compatibility.
 */
export default function FilterPanelCard({
  open,                   // boolean: controls visibility
  onClose,                // optional: close handler
  selectedDateRange,      // {from?: Date, to?: Date}
  setSelectedDateRange,
  tempDateRange,          // {from?: Date, to?: Date} — live edits before Apply
  setTempDateRange,
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

  function onRangeChange(range) {
    // DayPicker returns { from?: Date, to?: Date } (or undefined)
    setTempDateRange(range || undefined);
  }

  const hasTempRange = Boolean(tempDateRange?.from && tempDateRange?.to);

  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white p-4 md:p-6 shadow-lg ${className}`}
      role="dialog"
      aria-label="Filter venues"
    >
      {/* Header summary (optional) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)]">Filters</h3>
        <div className="text-xs md:text-sm text-gray-600">
          {hasTempRange
            ? `Dates: ${fmt(tempDateRange.from)} – ${fmt(tempDateRange.to)}`
            : "Choose dates"}
          {priceRange ? ` • Price: $${priceRange.min}–$${priceRange.max}` : ""}
          {selectedPlace ? ` • Place: ${selectedPlace}` : ""}
        </div>
      </div>

      {/* Content */}
      <div className="mt-8 text-left transition-opacity duration-300 space-y-6">
        {/* Dates */}
        <section aria-labelledby="filter-dates">
          <h4 id="filter-dates" className="mb-2 text-sm font-semibold text-gray-700">
            Dates
          </h4>
          <DayPicker
            mode="range"
            numberOfMonths={2}
            defaultMonth={tempDateRange?.from || minDate}
            selected={tempDateRange}
            onSelect={onRangeChange}
            fromDate={minDate}
            pagedNavigation
            captionLayout="buttons"
            className="rounded-lg border border-black/10 p-2"
          />
        </section>

        {/* Price */}
        <section aria-labelledby="filter-price">
          <h4 id="filter-price" className="mb-2 text-sm font-semibold text-gray-700">
            Price range
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-black/10 p-3">
              <label className="block text-xs text-gray-600 mb-1">Min</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-24 rounded-md border border-black/10 px-2 py-1 text-sm"
                  value={priceRange?.min ?? 0}
                  min={0}
                  max={priceRange?.max ?? 9999}
                  onChange={(e) =>
                    setPriceRange?.({
                      min: Math.min(Number(e.target.value) || 0, priceRange.max),
                      max: priceRange.max,
                    })
                  }
                />
                <input
                  type="range"
                  className="flex-1"
                  min={0}
                  max={priceRange?.max ?? 9999}
                  value={priceRange?.min ?? 0}
                  onChange={(e) =>
                    setPriceRange?.({ min: Number(e.target.value), max: priceRange.max })
                  }
                />
              </div>
            </div>
            <div className="rounded-md border border-black/10 p-3">
              <label className="block text-xs text-gray-600 mb-1">Max</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-24 rounded-md border border-black/10 px-2 py-1 text-sm"
                  value={priceRange?.max ?? 9999}
                  min={priceRange?.min ?? 0}
                  max={99999}
                  onChange={(e) =>
                    setPriceRange?.({
                      min: priceRange.min,
                      max: Math.max(Number(e.target.value) || 0, priceRange.min),
                    })
                  }
                />
                <input
                  type="range"
                  className="flex-1"
                  min={priceRange?.min ?? 0}
                  max={99999}
                  value={priceRange?.max ?? 9999}
                  onChange={(e) =>
                    setPriceRange?.({ min: priceRange.min, max: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* Amenities / Meta */}
        <section aria-labelledby="filter-amenities">
          <h4 id="filter-amenities" className="mb-2 text-sm font-semibold text-gray-700">
            Amenities
          </h4>
          <div className="flex flex-wrap gap-3">
            {[
              ["wifi", "Wi-Fi"],
              ["parking", "Parking"],
              ["breakfast", "Breakfast"],
              ["pets", "Pets allowed"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-sm cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-black/20"
                  checked={!!metaFilters?.[key]}
                  onChange={(e) =>
                    setMetaFilters?.((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Location */}
        <section aria-labelledby="filter-location">
          <h4 id="filter-location" className="mb-2 text-sm font-semibold text-gray-700">
            Location
          </h4>
          <input
            id="cal-location-input"
            placeholder="Search by city, country, zip..."
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            type="text"
            value={selectedPlace ?? ""}
            onChange={(e) => setSelectedPlace?.(e.target.value)}
          />
        </section>

        {/* Actions */}
        <div className="pt-1 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (hasTempRange) setSelectedDateRange?.(tempDateRange);
              onClose?.();
            }}
            disabled={!hasTempRange}
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