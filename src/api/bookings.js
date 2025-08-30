// src/api/bookings.js
import { getAuthHeaders } from "./headers";

const API_BASE = "https://v2.api.noroff.dev";

export async function getProfileBookings(
  name,
  { page = 1, limit = 100, withVenue = true, sort = "dateFrom", sortOrder = "asc" } = {},
) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
    sortOrder,
  });
  if (withVenue) qs.set("_venue", "true");

  const url = `${API_BASE}/holidaze/profiles/${encodeURIComponent(name)}/bookings?${qs}`;

  const res = await fetch(url, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
  }
  return body; // { data, meta }
}
