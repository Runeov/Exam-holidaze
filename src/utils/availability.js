// src/utils/availability.js

// ISO | Date → ms at local midnight (we compare day-blocks, not times)
const toDayStartMs = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

// Standard [start, end) overlap check on day resolution
export function hasDateOverlap(aFrom, aTo, bFrom, bTo) {
  const aStart = toDayStartMs(aFrom);
  const aEnd = toDayStartMs(aTo);
  const bStart = toDayStartMs(bFrom);
  const bEnd = toDayStartMs(bTo);
  return aStart < bEnd && bStart < aEnd;
}

// For calendar components expecting Date objects
export function buildDisabledRanges(bookings = []) {
  return bookings.map((b) => ({
    from: new Date(b.dateFrom),
    to: new Date(b.dateTo),
  }));
}
