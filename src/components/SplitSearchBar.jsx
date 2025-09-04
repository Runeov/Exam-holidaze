/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { FaSearch } from "react-icons/fa";

export default function SplitSearchBar({
  location,
  setLocation,
  dateRange,
  setDateRange,
  guests,
  setGuests,
  onSearch,
}) {
  const fromLabel =
    dateRange?.from instanceof Date ? dateRange.from.toLocaleDateString() : "Check in";
  const toLabel = dateRange?.to instanceof Date ? dateRange.to.toLocaleDateString() : "Check out";
  const guestsLabel = guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests";

  return (
    <div
      role="search"
      aria-label="Stay search"
      className="group relative flex w-full max-w-full md:max-w-2xl items-center rounded-full border border-gray-300 bg-white shadow-sm overflow-hidden"
    >
      {/* Segments */}
      <div className="flex flex-1 divide-x divide-gray-200">
        {/* Location */}
        <button
          type="button"
          onClick={() => {
            /* open location modal */
          }}
          className="flex-1 min-w-0 px-4 py-2 sm:py-3 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 rounded-l-full"
          aria-label="Choose location"
        >
          <span className="block text-xs uppercase tracking-wide text-gray-500 sm:text-[11px]">
            Where
          </span>
          <span className="block text-sm font-medium text-gray-900 truncate">
            {location || "Add location"}
          </span>
        </button>

        {/* Dates */}
        <button
          type="button"
          onClick={() => {
            /* open date picker */
          }}
          className="flex-1 min-w-0 px-4 py-2 sm:py-3 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2"
          aria-label="Choose dates"
        >
          <span className="block text-xs uppercase tracking-wide text-gray-500 sm:text-[11px]">
            Dates
          </span>
          <span className="block text-sm font-medium text-gray-900 truncate">
            {fromLabel} – {toLabel}
          </span>
        </button>

        {/* Guests */}
        <button
          type="button"
          onClick={() => {
            /* open guests modal */
          }}
          className="flex-1 min-w-0 px-4 py-2 sm:py-3 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 rounded-r-full"
          aria-label="Choose number of guests"
        >
          <span className="block text-xs uppercase tracking-wide text-gray-500 sm:text-[11px]">
            Guests
          </span>
          <span className="block text-sm font-medium text-gray-900 truncate">{guestsLabel}</span>
        </button>
      </div>

      {/* Search Button (fixed width, no horizontal overflow) */}
      <button
        type="button"
        onClick={onSearch}
        aria-label="Search"
        className="shrink-0 m-1 rounded-full p-3 bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white focus:outline-none focus-visible:ring-2"
      >
        <FaSearch size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
