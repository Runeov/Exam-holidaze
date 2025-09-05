// src/api/venues.js
import { installInterceptors } from "./http";

// List venues (no client cache)
export async function listVenues({
  page = 1,
  limit = 25,
  q,
  sort,
  order,
  withOwner = false,
  signal,
} = {}) {
  const params = {
    page,
    limit,
    q,
    sort,
    sortOrder: order,
    _owner: withOwner || undefined,
  };
  const res = await installInterceptors("/holidaze/venues", { params, signal });
  return res?.data?.data ?? res?.data;
}

export async function getMyVenues(
  name,
  { page = 1, limit = 25, sort, order, withBookings = false, withOwner = true, signal } = {},
) {
  const params = {
    page,
    limit,
    sort,
    sortOrder: order,
    _bookings: withBookings || undefined,
    _owner: withOwner || undefined,
  };

  const res = await installInterceptors(`/holidaze/profiles/${encodeURIComponent(name)}/venues`, {
    params,
    signal,
  });

  return res?.data?.data ?? res?.data;
}
// Single venue (no client cache)
export async function getVenue(id, { withBookings = true, withOwner = true } = {}) {
  const params = {
    _bookings: withBookings || undefined,
    _owner: withOwner || undefined,
  };
  const res = await installInterceptors(`/holidaze/venues/${encodeURIComponent(id)}`, { params });
  return res?.data?.data ?? res?.data;
}

// Create / Update / Delete
export function createVenue(payload, auth) {
  return installInterceptors("/holidaze/venues", payload, auth);
}
export function updateVenue(id, payload, auth) {
  return installInterceptors(`/holidaze/venues/${encodeURIComponent(id)}`, payload, auth);
}
export function deleteVenue(id, config) {
  return installInterceptors(`/holidaze/venues/${encodeURIComponent(id)}`, config);
}
