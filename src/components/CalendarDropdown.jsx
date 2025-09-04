/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function CalendarDropdown({
  selected,
  onChange,
  onApply,
  onPriceRangeChange,
  onMetaFilterChange,
  onLocationChange, // ✅ NEW
  minDate,
  disabled,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dates");
  const popoverRef = useRef(null);

  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 9999,
  });

  const [metaFilters, setMetaFilters] = useState({
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  });

  const [locationInput, setLocationInput] = useState(""); // ✅

  const label =
    selected?.from && selected?.to
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

  const handleApply = () => {
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
    if (locationInput.trim()) {
      onLocationChange?.(locationInput.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2 relative">
      <span className="block text-sm font-medium">Choose filters</span>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="calendar-dropdown"
          onClick={() => setIsOpen((p) => !p)}
          className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.03]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {label}
        </button>
      </div>

      {isOpen && (
        <div
          id="calendar-dropdown"
          ref={popoverRef}
          className="absolute z-20 mt-2 w-full rounded-xl border border-black/10 bg-white p-3 shadow-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl border p-3 bg-white space-y-4">
            {/* 🔘 Tabs */}
            <div className="flex border-b border-gray-200 text-sm font-medium">
              {["dates", "price", "filters", "location"].map((tab) => (
                <button
                  key={tab}
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

            {/* 📅 Dates Tab */}
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
                    className="rounded-lg border border-black/10 px-3 py-2 hover:bg-black/[.03]
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                               focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={handleApply}
                    disabled={!selected?.from || !selected?.to}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* 💰 Price Tab */}
            {activeTab === "price" && (
              <div className="space-y-4">
                <div>
                  <span className="block text-sm font-medium mb-1">Price Range ($)</span>
                  <div className="space-y-2">
                    {/* Min Price */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="min-price" className="text-sm text-gray-700 w-16">
                        Min
                      </label>
                      <input
                        id="min-price"
                        type="range"
                        min={0}
                        max={9999}
                        value={priceRange.min}
                        onChange={handleMinPriceChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm w-20 text-gray-500">${priceRange.min}</span>
                    </div>

                    {/* Max Price */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="max-price" className="text-sm text-gray-700 w-16">
                        Max
                      </label>
                      <input
                        id="max-price"
                        type="range"
                        min={0}
                        max={9999}
                        value={priceRange.max}
                        onChange={handleMaxPriceChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm w-20 text-gray-500">${priceRange.max}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🧩 Filters Tab */}
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

            {/* 📍 Location Tab */}
            {activeTab === "location" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="location-input" className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <input
                    id="location-input"
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Search by city, country, zip..."
                    className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/[.03]
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                               focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={handleLocationApply}
                    disabled={!locationInput.trim()}
                  >
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
