/** Normalize any date-like to UTC midnight for safe comparisons */
export function toUtcMidnight(dateLike) {
  const d = new Date(dateLike);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Treat ranges as [start, end) — end is exclusive */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const A1 = toUtcMidnight(aStart);
  const A2 = toUtcMidnight(aEnd);
  const B1 = toUtcMidnight(bStart);
  const B2 = toUtcMidnight(bEnd);
  return A1 < B2 && B1 < A2;
}

/** Convert API bookings to disabled ranges for calendars (inclusive of last night) */
export function bookingsToDisabledRanges(bookings = []) {
  return bookings.map((b) => {
    const from = toUtcMidnight(b.dateFrom);
    const toExclusive = toUtcMidnight(b.dateTo);
    // last night is dateTo - 1 day
    const to = new Date(toExclusive.getTime() - 24 * 60 * 60 * 1000);
    return { from, to };
  });
}

/** Any overlap with [dateFrom, dateTo)? */
export function hasBookingConflict(bookings = [], dateFrom, dateTo) {
  return bookings.some((b) => rangesOverlap(dateFrom, dateTo, b.dateFrom, b.dateTo));
}

/** Overlap that excludes a given booking id (for edit flows) */
export function hasOverlapExcluding(bookings = [], dateFrom, dateTo, excludeId) {
  return bookings.some(
    (b) => b.id !== excludeId && rangesOverlap(dateFrom, dateTo, b.dateFrom, b.dateTo),
  );
}

/** Convert a Date (local) → ISO at UTC midnight to avoid TZ drift */
export function toIsoZMidnight(date) {
  if (!date) return "";
  const d = new Date(date);
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString();
}

/** Pretty date (e.g., 2025 Aug 30) */
export function fmt(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Nights count between two ISO dates */
export function nightsBetween(fromIso, toIso) {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}
