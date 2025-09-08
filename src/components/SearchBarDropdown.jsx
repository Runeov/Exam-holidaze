import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useNavigate } from "react-router-dom";

function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SearchBarDropdown({
  selected,
  onChange = () => {},
  onApply = () => {},
  onPriceRangeChange = () => {},
  onMetaFilterChange = () => {},
  onLocationChange = () => {},
  minDate,
  disabled,
  selectedPlace,
  selectedDateRange,
}) {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("location");
  const popoverRef = useRef(null);
  const locationInputRef = useRef(null);

  const [guests, setGuests] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
  const [metaFilters, setMetaFilters] = useState({
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  });
  const [locationInput, setLocationInput] = useState("");

  // Unique IDs for a11y
  const uid = useId();
  const dropdownId = `${uid}-dropdown`;
  const locationInputId = `${uid}-location-input`;

  // Keep the latest values to avoid stale closures with setTimeout
  const latestRef = useRef({});
  useEffect(() => {
    latestRef.current = { selected, selectedPlace, guests, priceRange, metaFilters, locationInput };
  }, [selected, selectedPlace, guests, priceRange, metaFilters, locationInput]);

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

  const applyPendingLocationIfNeeded = () => {
    const typed = (locationInput ?? "").trim();
    const current = (selectedPlace ?? "").trim();
    if (typed && typed !== current) onLocationChange?.(typed);
  };

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

  const buildParams = () => {
    const { selected, selectedPlace, guests, priceRange, metaFilters, locationInput } =
      latestRef.current;
    const params = new URLSearchParams();

    const typed = (locationInput ?? "").trim();
    const place = typed || (selectedPlace ?? "").trim();
    if (place) params.set("place", place);

    if (selected?.from && selected?.to) {
      params.set("from", selected.from.toISOString());
      params.set("to", selected.to.toISOString());
    }

    if (Number.isFinite(guests) && guests > 0) params.set("guests", String(guests));
    if (priceRange?.min > 0) params.set("min", String(priceRange.min));
    if (priceRange?.max < 9999) params.set("max", String(priceRange.max));

    Object.entries(metaFilters ?? {}).forEach(([key, val]) => {
      if (val) params.append("features", key);
    });

    return params;
  };

  const runSearch = () => {
    const params = buildParams();
    setIsOpen(false);
    navigate(`/venues?${params.toString()}`);
  };

  const handleSearchClick = () => {
    applyPendingLocationIfNeeded();
    setIsOpen(false);
    setTimeout(() => runSearch(), 0);
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

  const dateChunk = selectedDateRange?.from ? `${fmt(selectedDateRange.from)}` : "Any week";
  const guestChunk = guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "";
  const searchLabel = `${selectedPlace || "Anywhere"} · ${dateChunk}${guestChunk ? ` · ${guestChunk}` : ""}`;

  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        onClick={() => setIsOpen((p) => !p)}
        className="
          w-full flex items-center gap-2 rounded-full border border-black/10
          bg-white/90 px-4 py-2 pr-12 text-sm text-left shadow-md backdrop-blur-sm
          hover:bg-white focus:outline-none
          focus-visible:ring-2 focus-visible:ring-[--color-accent-500]
          focus-visible:ring-offset-2 focus-visible:ring-offset-white
        "
      >
        <span className="text-[--color-text-muted] flex-1 truncate">{searchLabel}</span>
      </button>

      {/* Floating round search button (flush to the right) */}
      <button
        type="button"
        aria-label="Search"
        onClick={handleSearchClick}
        className="
          absolute right-0 top-1/2 -translate-y-1/2
          h-10 w-10 rounded-full grid place-items-center
          bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)]
          shadow hover:bg-[color:var(--color-accent-700)] active:scale-95 transition
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          focus-visible:ring-[color:var(--color-accent-500)]
        "
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={dropdownId}
          ref={popoverRef}
          className="
            absolute z-50 mt-2 w-full
            rounded-2xl border border-[--color-ring]
            bg-white/95 backdrop-blur-md p-3 shadow-lg
          "
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl border border-black/10 p-3 bg-white/90 backdrop-blur-sm space-y-4">
            <div className="flex border-b border-black/10 text-sm font-medium">
              {["location", "dates", "guests", "price", "filters"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`
                    capitalize px-4 py-2 -mb-px border-b-2 transition
                    ${activeTab === tab
                      ? "border-[--color-brand-600] text-[--color-brand-700]"
                      : "border-transparent text-[--color-text-muted] hover:text-[--color-text]"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500]
                    focus-visible:ring-offset-2 focus-visible:ring-offset-white
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "location" && (
              <div className="space-y-4">
                <label htmlFor={locationInputId} className="block text-sm font-medium text-[--color-text] mb-1">
                  Location
                </label>
                <input
                  id={locationInputId}
                  ref={locationInputRef}
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLocationApply();
                  }}
                  placeholder="Search by city, country, zip..."
                  className="
                    w-full rounded-lg px-3 py-2 text-sm
                    border border-black/10 bg-white/95 text-[--color-text] placeholder:text-[--color-text-muted]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500]
                    focus-visible:ring-offset-2 focus-visible:ring-offset-white
                  "
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]
                      transition shadow-sm px-4 py-2 text-sm
                      border border-black/10 text-[--color-text] hover:bg-black/[.03]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500]
                      focus-visible:ring-offset-2 focus-visible:ring-offset-white
                    "
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
                <p className="text-xs text-[--color-text-muted] mt-2">
                  Select a start and end date. Booked dates are disabled.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]
                      transition shadow-sm px-4 py-2 text-sm
                      border border-black/10 text-[--color-text] hover:bg-black/[.03]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500]
                      focus-visible:ring-offset-2 focus-visible:ring-offset-white
                    "
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
                <span className="block text-sm font-medium text-[--color-text] mb-1">Guests</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="
                      px-3 py-1 rounded border border-black/10 text-[--color-text]
                      hover:bg-black/[.03]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500]
                      focus-visible:ring-offset-2 focus-visible:ring-offset-white
                    "
                    aria-label="Decrease guests"
                  >
                    –
                  </button>
                  <span className="text-lg font-medium text-[--color-text]">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests((g) => g + 1)}
                    className="
                      px-3 py-1 rounded border border-black/10 text-[--color-text]
                      hover:bg-black/[.03]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500]
                      focus-visible:ring-offset-2 focus-visible:ring-offset-white
                    "
                    aria-label="Increase guests"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

           {activeTab === "price" && (
  <div className="space-y-4">
    <span className="block text-sm font-medium text-[--color-text] mb-1">
      Price Range ($)
    </span>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          htmlFor={`${uid}-price-min`}
          className="text-sm text-[--color-text] w-16"
        >
          Min
        </label>
        <input
          id={`${uid}-price-min`}
          type="range"
          min={0}
          max={9999}
          value={priceRange.min}
          onChange={handleMinPriceChange}
          className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm w-20 text-[--color-text-muted]">
          ${priceRange.min}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label
          htmlFor={`${uid}-price-max`}
          className="text-sm text-[--color-text] w-16"
        >
          Max
        </label>
        <input
          id={`${uid}-price-max`}
          type="range"
          min={0}
          max={9999}
          value={priceRange.max}
          onChange={handleMaxPriceChange}
          className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm w-20 text-[--color-text-muted]">
          ${priceRange.max}
        </span>
      </div>
    </div>
  </div>
)}


            {activeTab === "filters" && (
              <div className="space-y-2">
                <span className="block text-sm font-medium text-[--color-text] mb-1">Amenities</span>
                <div className="grid grid-cols-2 gap-2 text-sm text-[--color-text]">
                  {Object.keys(metaFilters).map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={metaFilters[key]}
                        onChange={() => toggleMeta(key)}
                        className="accent-[--color-accent-500]"
                      />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4 border-t border-black/10 mt-6">
            <button
              type="button"
              className="
                inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]
                transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                px-5 py-2 text-sm
                ring-[color:var(--color-accent-500)]
                bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)]
                hover:bg-[color:var(--color-accent-700)] active:scale-[0.98]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                focus-visible:ring-[color:var(--color-accent-500)]
              "
              onClick={handleSearchClick}
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}