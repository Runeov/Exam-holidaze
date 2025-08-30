// src/api/bookings.js
import { getAuthHeaders } from "./auth";

const API = "https://v2.api.noroff.dev";

// Helper: coerce Date|string -> ISO8601 (keeps undefined as-is)
function toIso(value) {
  if (!value) return value;
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString();
}

/**
 * Create a booking
 * @param {{ venueId: string, dateFrom: string|Date, dateTo: string|Date, guests: number }} payload
 * @returns {Promise<object>} created booking object
 */
export async function createBooking({ venueId, dateFrom, dateTo, guests }) {
  if (!venueId) throw new Error("createBooking: venueId is required");
  if (!dateFrom || !dateTo) throw new Error("createBooking: dateFrom and dateTo are required");
  if (!guests || guests < 1) throw new Error("createBooking: guests must be at least 1");

  const body = {
    venueId,
    dateFrom: toIso(dateFrom),
    dateTo: toIso(dateTo),
    guests: Number(guests),
  };

  console.log("[api:createBooking] ->", body);

  const res = await fetch(`${API}/holidaze/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(), // should include Authorization + X-Noroff-API-Key
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Surface API error message if present
    const apiMsg = json?.errors?.[0]?.message;
    throw new Error(apiMsg || `Failed to create booking (${res.status})`);
  }

  // Noroff v2 wraps as { data, meta }
  return json?.data ?? json;
}

/**
 * Get a profile's bookings (e.g., "My bookings").
 * Includes related venue data by default so you can show venue names.
 *
 * @param {string} name - Profile handle (not email)
 * @param {object} [opts]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=50]
 * @param {boolean} [opts.includeVenue=true]    // adds `_venue=true`
 * @param {boolean} [opts.includeCustomer=false]// adds `_customer=true`
 * @param {boolean} [opts.includeOwner=false]   // adds `_owner=true`
 */
export async function getProfileBookings(
  name,
  { page = 1, limit = 50, includeVenue = true, includeCustomer = false, includeOwner = false } = {},
) {
  if (!name) throw new Error("getProfileBookings: 'name' is required");

  const url = new URL(`${API}/holidaze/profiles/${encodeURIComponent(name)}/bookings`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (includeVenue) url.searchParams.set("_venue", "true");
  if (includeCustomer) url.searchParams.set("_customer", "true");
  if (includeOwner) url.searchParams.set("_owner", "true");

  console.log("[api:getProfileBookings] ->", url.toString());
  const res = await fetch(url, { headers: { ...getAuthHeaders() } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || `Failed to load bookings (${res.status})`);
  }
  return json?.data ?? json;
}

/**
 * Update a booking (allowed fields: dateFrom, dateTo, guests).
 * Uses PUT; switch to PATCH if you prefer partial updates.
 *
 * @param {string} bookingId
 * @param {{dateFrom?: string|Date, dateTo?: string|Date, guests?: number}} changes
 */
export async function updateBooking(bookingId, changes = {}) {
  if (!bookingId) throw new Error("updateBooking: 'bookingId' is required");

  const payload = {};
  if (changes.dateFrom) payload.dateFrom = toIso(changes.dateFrom);
  if (changes.dateTo) payload.dateTo = toIso(changes.dateTo);
  if (typeof changes.guests === "number") payload.guests = changes.guests;

  console.log("[api:updateBooking] id:", bookingId, "payload:", payload);

  const res = await fetch(`${API}/holidaze/bookings/${encodeURIComponent(bookingId)}`, {
    method: "PUT", // or "PATCH"
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || `Failed to update booking (${res.status})`);
  }
  return json?.data ?? json;
}

/**
 * Delete a booking by id.
 * @param {string} bookingId
 * @returns {Promise<boolean>} true if deleted
 */
export async function deleteBooking(bookingId) {
  if (!bookingId) throw new Error("deleteBooking: 'bookingId' is required");

  console.log("[api:deleteBooking] id:", bookingId);

  const res = await fetch(`${API}/holidaze/bookings/${encodeURIComponent(bookingId)}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });

  if (res.status === 204) return true;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || `Failed to delete booking (${res.status})`);
  }
  return true;
}
