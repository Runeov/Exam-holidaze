// src/components/SearchCTAButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { encodeSearchParams } from "../utils/SearchParams";
export default function SearchCTAButton({
  selectedPlace,
  selectedDateRange,
  priceRange,
  metaFilters,
  className = "",
}) {
  const navigate = useNavigate();

  function handleClick() {
    const qs = encodeSearchParams({
      selectedPlace,
      selectedDateRange,
      priceRange,
      metaFilters,
    });
    const url = qs ? `/search?${qs}` : "/search";
    navigate(url);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "inline-flex items-center justify-center rounded-[var(--radius-md)]",
        "bg-[color:var(--color-brand-500)] text-[color:var(--color-white-true)]",
        "px-4 py-2 text-sm font-semibold shadow-sm",
        "hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 ring-[color:var(--color-brand-500)] ring-offset-2",
        className,
      ].join(" ")}
      aria-label="Search"
    >
      Search
    </button>
  );
}
