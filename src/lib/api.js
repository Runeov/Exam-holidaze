// src/lib/api.js
import axios from "axios";

const BASE = "https://v2.api.noroff.dev/holidaze";

// Featured for landing
export async function getFeaturedVenues({ limit = 6 } = {}) {
  const url = `${BASE}/venues?sort=rating&sortOrder=desc&limit=${limit}`;
  console.log("➡️ GET", url);
  const { data } = await axios.get(url);
  return data?.data ?? [];
}

// Generic single page fetch (helper)
async function getVenuesPage({ page = 1, limit = 100 } = {}) {
  const url = `${BASE}/venues?page=${page}&limit=${limit}`;
  console.log("➡️ GET", url);
  const res = await axios.get(url);
  return res.data; // expect shape { data: [...], meta?: {...} }
}

// Fallback offset paging (some APIs use offset instead of page)
async function getVenuesOffset({ offset = 0, limit = 100 } = {}) {
  const url = `${BASE}/venues?offset=${offset}&limit=${limit}`;
  console.log("➡️ GET", url);
  const res = await axios.get(url);
  return res.data;
}

// Fetch ALL venues by paging until done
export async function getAllVenues({
  perRequest = 100,
  maxPages = 200, // safety guard
} = {}) {
  const all = [];

  try {
    // Try page-based pagination first
    let page = 1;
    while (page <= maxPages) {
      const payload = await getVenuesPage({ page, limit: perRequest });
      const chunk = payload?.data ?? [];
      const meta = payload?.meta;

      console.log(`📄 page=${page} received=${chunk.length}`);

      all.push(...chunk);

      // If meta tells us how many pages there are, use it
      const pageCount = meta?.pageCount ?? meta?.totalPages ?? meta?.pagination?.pageCount;

      if (pageCount) {
        if (page >= pageCount) break;
      } else {
        // Fallback: stop when last page smaller than perRequest
        if (chunk.length < perRequest) break;
      }

      page += 1;
    }

    // If we got anything, return it
    if (all.length) {
      console.log("✅ Completed page-based fetch:", all.length);
      return all;
    }
  } catch (e) {
    console.warn("⚠️ Page-based fetch failed, will try offset:", e?.message);
  }

  // Fallback to offset-based pagination if page-based failed / returned nothing
  try {
    let offset = 0;
    for (let i = 0; i < maxPages; i++) {
      const payload = await getVenuesOffset({ offset, limit: perRequest });
      const chunk = payload?.data ?? [];
      console.log(`📦 offset=${offset} received=${chunk.length}`);

      if (!chunk.length) break;

      all.push(...chunk);
      if (chunk.length < perRequest) break; // last partial page
      offset += perRequest;
    }
  } catch (e) {
    console.error("❌ Offset-based fetch also failed:", e?.message);
  }

  console.log("✅ Completed fetch:", all.length);
  return all;
}

// Keeping this export for callers that truly want a single page
export async function getVenues({ limit = 100 } = {}) {
  const payload = await getVenuesPage({ page: 1, limit });
  return payload?.data ?? [];
}
