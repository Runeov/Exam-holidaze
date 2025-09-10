// src/components/SearchCTAButton.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { encodeSearchParams } from "../utils/SearchParams";

export default function SearchCTAButton({
  selectedPlace,
  selectedDateRange,
  priceRange,
  metaFilters,
  className = "",
  to = "/venues",
  onSubmit,
}) {
  const navigate = useNavigate();

  const filters = useMemo(
    () => ({
      selectedPlace: (selectedPlace || "").trim(),
      selectedDateRange: selectedDateRange || undefined,
      priceRange: priceRange || { min: 0, max: 9999 },
      metaFilters: metaFilters || {},
    }),
    [selectedPlace, selectedDateRange, priceRange, metaFilters],
  );

  function handleClick() {
    if (typeof onSubmit === "function") {
      onSubmit(filters);
      return;
    }
    const qs = encodeSearchParams(filters);
    const dest = to || "/venues";
    navigate(qs ? `${dest}?${qs}` : dest);
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
