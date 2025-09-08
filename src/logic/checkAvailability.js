// src/logic/checkAvailability.js
import { getVenue } from "../api/venues";
import { hasDateOverlap } from "../utils/availability";

// Re-fetch current bookings right before POST to avoid race conditions
export async function checkAvailability({ venueId, dateFrom, dateTo, auth }) {
  const res = await getVenue(venueId, { withBookings: true, withOwner: false }, auth);
  const fresh = res?.data?.data;
  const bookings = fresh?.bookings || [];
  const conflict = bookings.find((b) => hasDateOverlap(dateFrom, dateTo, b.dateFrom, b.dateTo));
  return { ok: !conflict, conflict };
}
