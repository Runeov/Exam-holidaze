// src/api/bookings.js
import { http } from "./http";

/**
 * POST /holidaze/bookings
 * body: { dateFrom, dateTo, guests, venueId }
 */
export async function createBooking({ venueId, dateFrom, dateTo, guests }) {
  const payload = {
    venueId,
    dateFrom,
    dateTo,
    guests: Number(guests),
  };

  const res = await http.post("/holidaze/bookings", payload);
  return res.data?.data ?? res.data;
}

/**
 * Primary: GET /holidaze/profiles/:name/bookings
 * Includes expansions when requested; optional fallback to /holidaze/bookings for debugging.
 */
export async function getProfileBookings(name) {
  const params = {
    _venue: true,
    _customer: true,
    sort: "dateFrom",
    sortOrder: "asc",
    page: 1,
    limit: 50,
  };

  const res = await http.get(`/holidaze/profiles/${encodeURIComponent(name)}/bookings`, { params });

  return res.data; // { data: [...], meta: {...} }
}

// Update a booking
export async function updateBooking(id, { dateFrom, dateTo, guests }) {
  const payload = {};
  if (dateFrom) payload.dateFrom = dateFrom;
  if (dateTo) payload.dateTo = dateTo;
  if (guests != null) payload.guests = Number(guests);

  const res = await http.put(`/holidaze/bookings/${encodeURIComponent(id)}`, payload);
  return res.data?.data ?? res.data;
}

// Delete a booking
export async function deleteBooking(id) {
  await http.delete(`/holidaze/bookings/${encodeURIComponent(id)}`);
  // 204 expected
  return true;
}
