// src/utils/dates.js
export function toUtcMidnight(dateLike) {
  const d = new Date(dateLike);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Treat ranges as [start, end) — i.e., end is exclusive.
 * Two ranges overlap if startA < endB && startB < endA.
 */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const A1 = toUtcMidnight(aStart),
    A2 = toUtcMidnight(aEnd);
  const B1 = toUtcMidnight(bStart),
    B2 = toUtcMidnight(bEnd);
  return A1 < B2 && B1 < A2;
}

/**
 * Given venue.bookings, return day-picker disabled ranges.
 * Bookings from API include dateFrom/dateTo strings; we normalize to UTC.
 */
export function bookingsToDisabledRanges(bookings = []) {
  return bookings.map((b) => ({
    from: toUtcMidnight(b.dateFrom),
    // end is exclusive; subtract 1 day for inclusive display blocks if needed
    to: new Date(toUtcMidnight(b.dateTo).getTime() - 24 * 60 * 60 * 1000),
  }));
}

/**
 * True if the requested date range collides with any existing bookings.
 */
export function hasBookingConflict(bookings = [], dateFrom, dateTo) {
  return bookings.some((b) => rangesOverlap(dateFrom, dateTo, b.dateFrom, b.dateTo));
}
