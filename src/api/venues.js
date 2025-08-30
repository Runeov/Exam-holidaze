// src/api/venues.js
import { http } from "./http";

/** Featured for landing */
export async function getFeaturedVenues({ limit = 6 } = {}) {
  const { data } = await http.get("/holidaze/venues", {
    params: { sort: "rating", sortOrder: "desc", limit },
  });
  return data?.data ?? [];
}

/** Single page helper */
async function getVenuesPage({ page = 1, limit = 100 } = {}) {
  const { data } = await http.get("/holidaze/venues", { params: { page, limit } });
  return data; // { data, meta }
}

/** Offset helper (fallback) */
async function getVenuesOffset({ offset = 0, limit = 100 } = {}) {
  const { data } = await http.get("/holidaze/venues", { params: { offset, limit } });
  return data;
}

/** Fetch ALL venues by paging until done */
export async function getAllVenues({ perRequest = 100, maxPages = 200 } = {}) {
  const all = [];

  // Page-based first
  try {
    let page = 1;
    while (page <= maxPages) {
      const payload = await getVenuesPage({ page, limit: perRequest });
      const chunk = payload?.data ?? [];
      const meta = payload?.meta;
      all.push(...chunk);

      const pageCount = meta?.pageCount ?? meta?.totalPages ?? meta?.pagination?.pageCount;
      if (pageCount ? page >= pageCount : chunk.length < perRequest) break;
      page += 1;
    }
    if (all.length) return all;
  } catch (e) {
    console.warn("[venues] page-based failed, trying offset:", e?.message);
  }

  // Offset fallback
  try {
    let offset = 0;
    for (let i = 0; i < maxPages; i++) {
      const payload = await getVenuesOffset({ offset, limit: perRequest });
      const chunk = payload?.data ?? [];
      if (!chunk.length) break;
      all.push(...chunk);
      if (chunk.length < perRequest) break;
      offset += perRequest;
    }
  } catch (e) {
    console.error("[venues] offset-based failed:", e?.message);
  }

  return all;
}

/** One page convenience */
export async function getVenues({ limit = 100 } = {}) {
  const payload = await getVenuesPage({ page: 1, limit });
  return payload?.data ?? [];
}

/** One venue */
export async function getVenueById(id) {
  const { data } = await http.get(`/holidaze/venues/${id}`);
  return data?.data ?? null;
}
