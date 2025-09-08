import React from "react";
import VenueCard from "./VenueCard";

/**
 * Renders a responsive grid of VenueCard items.
 * - items: array of venue objects
 * - priorityCount: how many cards should eager-load images
 */
export default function VenueGrid({ items = [], priorityCount = 6 }) {
  // Debug: verify we actually get an array + show first item keys
  const isArray = Array.isArray(items);
  const preview = isArray && items.length ? Object.keys(items[0] || {}) : [];
  console.groupCollapsed("[VenueGrid] items");
  console.log("isArray:", isArray, "length:", items?.length ?? "n/a");
  console.log("first item keys:", preview);
  console.groupEnd();

  if (!isArray) {
    console.error("[VenueGrid] items is not an array:", items);
    return <p className="text-text-muted">Unexpected data format.</p>;
  }

  if (!items.length) {
    return <p className="text-text-muted">No venues found.</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((venue, idx) => (
        <VenueCard key={venue?.id ?? `idx-${idx}`} venue={venue} priority={idx < priorityCount} />
      ))}
    </ul>
  );
}
