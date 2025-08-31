// src/api/venues.js
import { httpGet, httpPost, httpPut, httpDelete } from "./http.js";

// List venues (fast: no _bookings; optionally include owner for cards)
export function listVenues({ page = 1, limit = 25, q, sort, order, withOwner = false } = {}, auth) {
  const params = {
    page,
    limit,
    q,
    sort,
    sortOrder: order,
    _owner: withOwner || undefined,
  };
  return httpGet("/holidaze/venues", { params, ...auth });
}

// Single venue — ALWAYS include bookings + owner on details page
export function getVenue(id, { withBookings = true, withOwner = true } = {}, auth) {
  const params = {
    _bookings: withBookings || undefined,
    _owner: withOwner || undefined,
  };
  return httpGet(`/holidaze/venues/${id}`, { params, ...auth });
}

export function createVenue(payload, auth) {
  return httpPost("/holidaze/venues", payload, auth);
}
export function updateVenue(id, payload, auth) {
  return httpPut(`/holidaze/venues/${id}`, payload, auth);
}
export function deleteVenue(id, auth) {
  return httpDelete(`/holidaze/venues/${id}`, auth);
}

// Manager overview: your venues incl. bookings
export function getMyVenues(profileName, { withBookings = true } = {}, auth) {
  const params = { _bookings: withBookings || undefined };
  return httpGet(`/holidaze/profiles/${profileName}/venues`, { params, ...auth });
}
