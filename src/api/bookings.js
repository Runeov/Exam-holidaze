import { installInterceptors } from "./http";

/* ----------------------------- date utilities ----------------------------- */

// Convert any date-like to ISO @ UTC midnight (Z) for day-granularity booking.
function toIsoZMidnight(value) {
  if (!value) return value;
  const d = value instanceof Date ? value : new Date(value);
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString();
}

// Normalize to UTC midnight (Date object) for safe [start, end) compare.
function midUTC(dateLike) {
  const d = new Date(dateLike);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Standard [start, end) overlap check at UTC-midnight resolution.
export function hasDateOverlap(aFrom, aTo, bFrom, bTo) {
  const A1 = midUTC(aFrom);
  const A2 = midUTC(aTo);
  const B1 = midUTC(bFrom);
  const B2 = midUTC(bTo);
  return A1 < B2 && B1 < A2;
}

/* --------------------------- availability helpers -------------------------- */

/**
 * Live availability check right before creating a booking.
 * @param {{ venueId: string, dateFrom: string|Date, dateTo: string|Date, auth?: {token?: string, apiKey?: string} }} args
 * @returns {Promise<{ ok: boolean, conflict?: {id:string,dateFrom:string,dateTo:string} }>}
 */
export async function checkAvailability({ venueId, dateFrom, dateTo, auth }) {
  if (!venueId) throw new Error("checkAvailability: 'venueId' is required");

  // Fetch venue with bookings only (fast + enough data)
  const res = await installInterceptors(`/holidaze/venues/${encodeURIComponent(venueId)}`, {
    params: { _bookings: true },
    ...auth,
  });

  const bookings = res?.data?.data?.bookings || [];
  const conflict = bookings.find((b) => hasDateOverlap(dateFrom, dateTo, b.dateFrom, b.dateTo));
  return { ok: !conflict, conflict };
}

/**
 * Fetch bookings for a venue (bookings only).
 * @param {string} venueId
 * @param {{auth?: {token?: string, apiKey?: string}}} [opts]
 */
export async function getVenueBookings(venueId, { auth } = {}) {
  if (!venueId) throw new Error("getVenueBookings: 'venueId' is required");
  const res = await installInterceptors(`/holidaze/venues/${encodeURIComponent(venueId)}`, {
    params: { _bookings: true },
    ...auth,
  });
  return res?.data?.data?.bookings ?? [];
}

/* --------------------------------- CRUD ----------------------------------- */

/**
 * Create a booking (preflight overlap check by default).
 * @param {{ venueId: string, dateFrom: string|Date, dateTo: string|Date, guests: number }} payload
 * @param {{ skipPreflight?: boolean, auth?: {token?: string, apiKey?: string} }} [options]
 * @returns {Promise<object>} created booking
 */
export async function createBooking(
  { venueId, dateFrom, dateTo, guests },
  { skipPreflight = false, auth } = {},
) {
  if (!venueId) throw new Error("createBooking: 'venueId' is required");
  if (!dateFrom || !dateTo) throw new Error("createBooking: 'dateFrom' and 'dateTo' are required");
  if (!guests || guests < 1) throw new Error("createBooking: 'guests' must be at least 1");

  // Preflight (race guard)
  if (!skipPreflight) {
    const { ok, conflict } = await checkAvailability({ venueId, dateFrom, dateTo, auth });
    if (!ok) {
      const msg = `Those dates are already booked: ${conflict.dateFrom} → ${conflict.dateTo}`;
      throw new Error(msg);
    }
  }

  const body = {
    venueId,
    dateFrom: toIsoZMidnight(dateFrom),
    dateTo: toIsoZMidnight(dateTo),
    guests: Number(guests),
  };

  // Small retry for transient 429/5xx (optional safety net)
  try {
    const res = await installInterceptors("/holidaze/bookings", body, auth);
    return res?.data?.data ?? res?.data;
  } catch (err) {
    const code = err?.response?.status;
    if (code && (code === 429 || code >= 500)) {
      // one quick retry
      const res = await installInterceptors("/holidaze/bookings", body, auth);
      return res?.data?.data ?? res?.data;
    }
    const apiMsg = err?.response?.data?.errors?.[0]?.message;
    throw new Error(apiMsg || err?.message || "Failed to create booking");
  }
}

/**
 * Get a profile's bookings (e.g., "My bookings").
 * @param {string} profileName
 * @param {{ page?: number, limit?: number, includeVenue?: boolean, includeCustomer?: boolean, includeOwner?: boolean, auth?: {token?: string, apiKey?: string} }} [opts]
 */
export async function getProfileBookings(
  profileName,
  {
    page = 1,
    limit = 50,
    includeVenue = true,
    includeCustomer = false,
    includeOwner = false,
    auth,
  } = {},
) {
  if (!profileName) throw new Error("getProfileBookings: 'profileName' is required");
  const params = {
    page,
    limit,
    _venue: includeVenue || undefined,
    _customer: includeCustomer || undefined,
    _owner: includeOwner || undefined,
  };
  const res = await installInterceptors(
    `/holidaze/profiles/${encodeURIComponent(profileName)}/bookings`,
    {
      params,
      ...auth,
    },
  );
  return res?.data?.data ?? res?.data;
}

/**
 * Update a booking (PUT).
 * @param {string} bookingId
 * @param {{dateFrom?: string|Date, dateTo?: string|Date, guests?: number}} changes
 * @param {{auth?: {token?: string, apiKey?: string}}} [opts]
 */
export async function updateBooking(bookingId, changes = {}, { auth } = {}) {
  if (!bookingId) throw new Error("updateBooking: 'bookingId' is required");

  const payload = {};
  if (changes.dateFrom) payload.dateFrom = toIsoZMidnight(changes.dateFrom);
  if (changes.dateTo) payload.dateTo = toIsoZMidnight(changes.dateTo);
  if (typeof changes.guests === "number") payload.guests = Number(changes.guests);

  try {
    const res = await installInterceptors(
      `/holidaze/bookings/${encodeURIComponent(bookingId)}`,
      payload,
      auth,
    );
    return res?.data?.data ?? res?.data;
  } catch (err) {
    const apiMsg = err?.response?.data?.errors?.[0]?.message;
    throw new Error(apiMsg || err?.message || "Failed to update booking");
  }
}

/**
 * Delete a booking by id.
 * @param {string} bookingId
 * @param {{auth?: {token?: string, apiKey?: string}}} [opts]
 * @returns {Promise<boolean>}
 */
export async function deleteBooking(bookingId, { auth } = {}) {
  if (!bookingId) throw new Error("deleteBooking: 'bookingId' is required");
  try {
    const res = await installInterceptors(
      `/holidaze/bookings/${encodeURIComponent(bookingId)}`,
      auth,
    );
    // Noroff returns 204 No Content; axios wraps it with data = "".
    return res?.status === 204 || res?.data === "" || !!res;
  } catch (err) {
    const apiMsg = err?.response?.data?.errors?.[0]?.message;
    throw new Error(apiMsg || err?.message || "Failed to delete booking");
  }
}
