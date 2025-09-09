// src/utils/searchParams.js
// Utility to encode filter state into a URL query string for /search

function toIsoDate(d) {
  if (!d) return null;
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Encode filter state into query string
 *
 * @param {object} filters
 * @param {string=} filters.selectedPlace
 * @param {{from?:Date|string, to?:Date|string}=} filters.selectedDateRange
 * @param {{min?:number, max?:number}=} filters.priceRange
 * @param {{amenities?: string[]}=} filters.metaFilters
 * @returns {string} e.g. "q=Paris&from=2025-09-10&to=2025-09-12&minPrice=50&maxPrice=200&amenities=wifi,parking"
 */
export function encodeSearchParams(filters = {}) {
  const params = new URLSearchParams();

  const q = (filters.selectedPlace || "").trim();
  if (q) params.set("q", q);

  const from = toIsoDate(filters.selectedDateRange?.from);
  const to = toIsoDate(filters.selectedDateRange?.to);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const min = filters.priceRange?.min;
  const max = filters.priceRange?.max;
  if (Number.isFinite(min)) params.set("minPrice", String(min));
  if (Number.isFinite(max)) params.set("maxPrice", String(max));

  const amenities = filters.metaFilters?.amenities;
  if (Array.isArray(amenities) && amenities.length > 0) {
    params.set(
      "amenities",
      amenities
        .filter(Boolean)
        .map((s) => String(s).trim().toLowerCase())
        .filter(Boolean)
        .join(","),
    );
  }

  return params.toString();
}