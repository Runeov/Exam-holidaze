/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useNavigate } from "react-router-dom";

function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SearchBarDropdown({
  selected,
  onChange,
  onApply,
  onPriceRangeChange,
  onMetaFilterChange,
  onLocationChange,
  minDate,
  disabled,
  selectedPlace,
  selectedDateRange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("location"); // Location first
  const popoverRef = useRef(null);
  const locationInputRef = useRef(null);
  const navigate = useNavigate();

  const [guests, setGuests] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 99999 });
  const [metaFilters, setMetaFilters] = useState({
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  });
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    if (isOpen) setLocationInput(selectedPlace || "");
  }, [isOpen, selectedPlace]);

  useEffect(() => {
    if (isOpen && activeTab === "location") locationInputRef.current?.focus();
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
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
    const newMin = Number(e.target.value);
    const updated = { ...priceRange, min: newMin };
    setPriceRange(updated);
    onPriceRangeChange?.(updated);
  };

  const handleMaxPriceChange = (e) => {
    const newMax = Number(e.target.value);
    const updated = { ...priceRange, max: newMax };
    setPriceRange(updated);
    onPriceRangeChange?.(updated);
  };

  const toggleMeta = (key) => {
    const updated = { ...metaFilters, [key]: !metaFilters[key] };
    setMetaFilters(updated);
    onMetaFilterChange?.(updated);
  };

  const handleLocationApply = () => {
    const value = locationInput.trim();
    if (value) {
      onLocationChange?.(value);
      setIsOpen(false);
    }
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    if (selectedPlace) params.set("place", selectedPlace);
    if (selected?.from && selected?.to) {
      params.set("from", selected.from.toISOString());
      params.set("to", selected.to.toISOString());
    }
    if (guests > 0) params.set("guests", guests);
    if (priceRange.min > 0) params.set("min", priceRange.min);
    if (priceRange.max < 99999) params.set("max", priceRange.max);
    Object.entries(metaFilters).forEach(([key, val]) => {
      if (val) params.append("features", key);
    });
    return params;
  };

  const runSearch = () => {
    const params = buildParams();
    setIsOpen(false);
    navigate(`/venues?${params.toString()}`);
  };

  const dateChunk = selectedDateRange?.from ? `${fmt(selectedDateRange.from)}` : "Any week";
  const guestChunk = guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "";
  const searchLabel = `${selectedPlace || "Anywhere"} · ${dateChunk}${
    guestChunk ? ` · ${guestChunk}` : ""
  }`;

  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="searchbar-dropdown"
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-left hover:bg-black/[.03]
                 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-white"
      >
        <span className="text-gray-500 flex-1 truncate">{searchLabel}</span>
      </button>

      {/* Floating round search button */}
      <button
        type="button"
        aria-label="Search"
        onClick={runSearch}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full 
             bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)] 
             grid place-items-center shadow hover:bg-[color:var(--color-accent-700)] 
             active:scale-95 transition
             focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
             focus-visible:ring-[color:var(--color-accent-500)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="searchbar-dropdown"
          ref={popoverRef}
          className="absolute z-30 mt-2 w-full rounded-xl border border-black/10 bg-white p-3 shadow-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl border p-3 bg-white space-y-4">
            <div className="flex border-b border-gray-200 text-sm font-medium">
              {["location", "dates", "guests", "price", "filters"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize px-4 py-2 -mb-px border-b-2 ${
                    activeTab === tab
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "location" && (
              <div className="space-y-4">
                <label htmlFor="location-input" className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  id="location-input"
                  ref={locationInputRef}
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLocationApply();
                  }}
                  placeholder="Search by city, country, zip..."
                  className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={handleLocationApply}
                    disabled={!locationInput.trim()}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {activeTab === "dates" && (
              <div>
                <DayPicker
                  mode="range"
                  selected={selected}
                  onSelect={onChange}
                  fromDate={minDate}
                  numberOfMonths={2}
                  showOutsideDays
                  disabled={disabled}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Select a start and end date. Booked dates are disabled.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 px-3 py-2 hover:bg-black/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={handleApplyDates}
                    disabled={!selected?.from || !selected?.to}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {activeTab === "guests" && (
              <div className="space-y-4">
                <span className="block text-sm font-medium mb-1">Guests</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="px-3 py-1 rounded border hover:bg-gray-100"
                    aria-label="Decrease guests"
                  >
                    –
                  </button>
                  <span className="text-lg font-medium">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests((g) => g + 1)}
                    className="px-3 py-1 rounded border hover:bg-gray-100"
                    aria-label="Increase guests"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {activeTab === "price" && (
              <div className="space-y-4">
                <span className="block text-sm font-medium mb-1">Price Range ($)</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 w-16">Min</label>
                    <input
                      type="range"
                      min={0}
                      max={99999}
                      value={priceRange.min}
                      onChange={handleMinPriceChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm w-20 text-gray-500">${priceRange.min}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 w-16">Max</label>
                    <input
                      type="range"
                      min={0}
                      max={99999}
                      value={priceRange.max}
                      onChange={handleMaxPriceChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm w-20 text-gray-500">${priceRange.max}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "filters" && (
              <div className="space-y-2">
                <span className="block text-sm font-medium mb-1">Amenities</span>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  {Object.keys(metaFilters).map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={metaFilters[key]}
                        onChange={() => toggleMeta(key)}
                      />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              className="inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 text-sm ring-[color:var(--color-accent-500)] bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent-700)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent-500)]"
              onClick={runSearch}
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
