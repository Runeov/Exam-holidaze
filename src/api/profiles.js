// src/api/profiles.js
import { http } from "./http";

/** Get a profile by name with optional expansions */
export async function getProfile(name, { includeVenues = false, includeBookings = false } = {}) {
  const params = {};
  if (includeVenues) params._venues = true;
  if (includeBookings) params._bookings = true;

  const res = await http.get(`/holidaze/profiles/${encodeURIComponent(name)}`, { params });
  return res.data?.data ?? res.data;
}

/** Update profile fields (e.g., avatar, bio) */
export async function updateProfile(name, payload) {
  // Payload can be: { bio, avatar: { url, alt }, banner: { url, alt } }
  const res = await http.put(`/holidaze/profiles/${encodeURIComponent(name)}`, payload);
  return res.data?.data ?? res.data;
}
