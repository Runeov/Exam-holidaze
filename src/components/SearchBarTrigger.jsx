// src/components/SearchBarTrigger.jsx
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { useState } from "react";
import SearchBarDropdown from "./SearchBarDropdown";

export default function SearchBarTrigger({ selectedPlace, selectedDateRange, ...dropdownProps }) {
  const [isOpen, setIsOpen] = useState(false);

  const label = `${selectedPlace || "Anywhere"} · ${
    selectedDateRange?.from ? selectedDateRange.from.toLocaleDateString() : "Any week"
  }`;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="searchbar-dropdown"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-left hover:bg-black/[.03]
          shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-white"
      >
        <span className="text-gray-500 flex-1 truncate">{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-40 w-full mt-2" id="searchbar-dropdown">
          <SearchBarDropdown
            {...dropdownProps}
            selectedPlace={selectedPlace}
            selectedDateRange={selectedDateRange}
            onClose={() => setIsOpen(false)} // ⬅️ Optional close callback
          />
        </div>
      )}
    </div>
  );
}
