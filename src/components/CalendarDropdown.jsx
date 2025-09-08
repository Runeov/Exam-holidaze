import { useEffect, useRef, useState } from "react";
import BookingCalendar from "./BookingCalendar";
import { useStableId } from "../utils/uid";

function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * CalendarDropdown
 * A consolidated popover with tabs for Dates (using BookingCalendar), Price, Filters, and Location.
 */
export default function CalendarDropdown({
  selected,
  onChange,
  onApply,
  onPriceRangeChange,
  onMetaFilterChange,
  onLocationChange,
  minDate,
  bookings = [], 
  extraDisabled = [], 
}) {
  const uid = useStableId("cal");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dates");
  const popoverRef = useRef(null);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
  const [metaFilters, setMetaFilters] = useState({ wifi: false, parking: false, breakfast: false, pets: false });
  const [locationInput, setLocationInput] = useState("");

  const label = selected?.from && selected?.to
    ? `${fmt(selected.from)} – ${fmt(selected.to)}`
    : selected?.from
      ? fmt(selected.from)
      : "Dates";

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const handleApplyDates = () => {
    if (selected?.from && selected?.to) {
      onApply?.(selected);
      setIsOpen(false);
    }
  };

  const handleMinPriceChange = (e) => {
    const updated = { ...priceRange, min: Number(e.target.value) };
    setPriceRange(updated);
    onPriceRangeChange?.(updated);
  };
  const handleMaxPriceChange = (e) => {
    const updated = { ...priceRange, max: Number(e.target.value) };
    setPriceRange(updated);
    onPriceRangeChange?.(updated);
  };
  const handleApplyPrice = () => {
    onPriceRangeChange?.(priceRange);
    setIsOpen(false);
  };

  const toggleMeta = (key) => {
    const updated = { ...metaFilters, [key]: !metaFilters[key] };
    setMetaFilters(updated);
    onMetaFilterChange?.(updated);
  };
  const handleApplyFilters = () => {
    onMetaFilterChange?.(metaFilters);
    setIsOpen(false);
  };

  const handleLocationApply = () => {
    if (locationInput.trim()) {
      onLocationChange?.(locationInput.trim());
      setIsOpen(false);
    }
  };

  const CTA_PRIMARY =
    "inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-full border border-[var(--color-brand-600,#2563eb)] bg-[var(--color-brand-600,#2563eb)] text-white shadow-sm hover:bg-[var(--color-brand-700,#1d4ed8)] hover:shadow-md active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500,#3b82f6)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";
  const BTN =
    "rounded-full border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  return (
    <div className="relative space-y-2">
      <label htmlFor={`${uid}-toggle`} className="block text-sm font-medium">Choose filters</label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          id={`${uid}-toggle`}
          type="button"
          aria-expanded={isOpen}
          aria-controls={`${uid}-popover`}
          onClick={() => setIsOpen((p) => !p)}
          className={BTN}
        >
          {label}
        </button>
      </div>

      {isOpen && (
        <div
          id={`${uid}-popover`}
          ref={popoverRef}
          className="absolute z-20 mt-2 w-full rounded-xl border border-black/10 bg-white p-3 shadow-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="space-y-4 rounded-2xl border bg-white p-3">
            <div className="flex border-b border-gray-200 text-sm font-medium">
              {(["dates", "price", "filters", "location"]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`-mb-px border-b-2 px-4 py-2 capitalize ${
                    activeTab === tab
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "dates" && (
              <div>
                <BookingCalendar
                  bookings={bookings}
                  disabled={extraDisabled}
                  selected={selected}
                  onSelect={onChange}
                  minDate={minDate}
                  numberOfMonths={2}
                />
                <div className="mt-3 flex justify-center gap-2">
                  <button type="button" className={CTA_PRIMARY} onClick={handleApplyDates} disabled={!selected?.from || !selected?.to}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {activeTab === "price" && (
              <div className="space-y-4">
                <div>
                  <span className="mb-1 block text-sm font-medium">Price Range ($)</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`${uid}-min`} className="w-16 text-sm text-gray-700">Min</label>
                      <input
                        id={`${uid}-min`}
                        type="range"
                        min={0}
                        max={9999}
                        value={priceRange.min}
                        onChange={handleMinPriceChange}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                      />
                      <span className="w-20 text-sm text-gray-500">${priceRange.min}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`${uid}-max`} className="w-16 text-sm text-gray-700">Max</label>
                      <input
                        id={`${uid}-max`}
                        type="range"
                        min={0}
                        max={9999}
                        value={priceRange.max}
                        onChange={handleMaxPriceChange}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                      />
                      <span className="w-20 text-sm text-gray-500">${priceRange.max}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    className={CTA_PRIMARY}
                    onClick={handleApplyPrice}
                    disabled={Number(priceRange.min) > Number(priceRange.max)}
                    aria-disabled={Number(priceRange.min) > Number(priceRange.max)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {activeTab === "filters" && (
              <div className="space-y-2">
                <span className="mb-1 block text-sm font-medium">Amenities</span>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  {Object.keys(metaFilters).map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input type="checkbox" checked={metaFilters[key]} onChange={() => toggleMeta(key)} />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <button type="button" className={CTA_PRIMARY} onClick={handleApplyFilters}>
                    Apply
                  </button>
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor={`${uid}-loc`} className="mb-1 block text-sm font-medium">Location</label>
                  <input
                    id={`${uid}-loc`}
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && locationInput.trim()) handleLocationApply(); }}
                    placeholder="Search by city, country, zip..."
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div className="flex justify-center">
                  <button type="button" className={CTA_PRIMARY} onClick={handleLocationApply} disabled={!locationInput.trim()}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
