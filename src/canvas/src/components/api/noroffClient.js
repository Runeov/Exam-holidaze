// Path: docs/Noroff-API-Analysis.md
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
// Summary (for engineers)
// - API base: https://v2.api.noroff.dev
// - Auth: Bearer access token + X-Noroff-API-Key header required for authenticated endpoints.
// - Response shape: { data: T | T[], meta: {...pagination} }
// - Pagination: limit (default/max 100), page (1-based). Sorting: sort, sortOrder ('asc'|'desc').
// - Holidaze (venues/bookings/profiles): venues supports _owner and _bookings includes; bookings supports _venue and _customer includes.
// - Revenue model for Holidaze: venue.price per night * nights between booking.dateFrom and booking.dateTo.
// - Approved libs only: React + Tailwind (no axios or external state libs).

// Path: src/api/noroffClient.js
// Minimal Noroff v2 API client using fetch and approved resources only.
// Uses: Bearer + X-Noroff-API-Key for secured endpoints.

const NOROFF_BASE_URL = process.env.NOROFF_BASE_URL || "https://v2.api.noroff.dev";

/** Small helper to build query strings */
function qs(params = {}) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

/** Core fetch with error normalization */
async function noroffFetch(path, { token, apiKey, method = "GET", body, params, headers } = {}) {
  const url = `${NOROFF_BASE_URL}${path}${qs(params)}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // v2 returns { data, meta } on success; error returns structured error JSON as well
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const error = new Error(`Noroff API ${res.status} ${res.statusText}`);
    error.status = res.status; // why: surface HTTP status for UI decisions
    error.payload = payload;
    throw error;
  }
  return payload; // { data, meta }
}

// -------------------- Auth (unified) --------------------
export async function register({ name, email, password }) {
  return noroffFetch("/auth/register", { method: "POST", body: { name, email, password } });
}
export async function login({ email, password }) {
  return noroffFetch("/auth/login", { method: "POST", body: { email, password } });
}
export async function createApiKey({ token, name = "API Key" }) {
  return noroffFetch("/auth/create-api-key", { method: "POST", token, body: { name } });
}

// -------------------- Holidaze --------------------
// Venues
export async function getVenues({
  page = 1,
  limit = 100,
  includeOwner = false,
  includeBookings = false,
  sort,
  sortOrder,
} = {}) {
  const params = {
    page,
    limit,
    ...(includeOwner ? { _owner: true } : {}),
    ...(includeBookings ? { _bookings: true } : {}),
    sort,
    sortOrder,
  };
  return noroffFetch("/holidaze/venues", { params });
}
export async function getVenueById(id, { includeOwner = false, includeBookings = false } = {}) {
  const params = {
    ...(includeOwner ? { _owner: true } : {}),
    ...(includeBookings ? { _bookings: true } : {}),
  };
  return noroffFetch(`/holidaze/venues/${id}`, { params });
}

// Bookings (authenticated)
export async function getBookings({
  token,
  apiKey,
  page = 1,
  limit = 100,
  includeVenue = false,
  includeCustomer = false,
  sort,
  sortOrder,
} = {}) {
  const params = {
    page,
    limit,
    ...(includeVenue ? { _venue: true } : {}),
    ...(includeCustomer ? { _customer: true } : {}),
    sort,
    sortOrder,
  };
  return noroffFetch("/holidaze/bookings", { token, apiKey, params });
}
export async function createBooking({ token, apiKey, dateFrom, dateTo, guests, venueId }) {
  return noroffFetch("/holidaze/bookings", {
    method: "POST",
    token,
    apiKey,
    body: { dateFrom, dateTo, guests, venueId },
  });
}

// Profiles (authenticated for details; list is public)
export async function getProfiles({
  token,
  apiKey,
  page = 1,
  limit = 100,
  includeVenues = false,
  includeBookings = false,
  sort,
  sortOrder,
} = {}) {
  const params = {
    page,
    limit,
    ...(includeVenues ? { _venues: true } : {}),
    ...(includeBookings ? { _bookings: true } : {}),
    sort,
    sortOrder,
  };
  return noroffFetch("/holidaze/profiles", { token, apiKey, params });
}
export async function getProfile(
  name,
  { token, apiKey, includeVenues = false, includeBookings = false } = {},
) {
  const params = {
    ...(includeVenues ? { _venues: true } : {}),
    ...(includeBookings ? { _bookings: true } : {}),
  };
  return noroffFetch(`/holidaze/profiles/${encodeURIComponent(name)}`, { token, apiKey, params });
}

// -------------------- Helpers: pagination & aggregation --------------------
export async function getAllPages(fetchPage, { startPage = 1 } = {}) {
  let page = startPage;
  const out = []; // why: v2 returns data+meta; we must follow meta.isLastPage
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, meta } = await fetchPage(page);
    if (Array.isArray(data)) out.push(...data);
    else out.push(data);
    if (meta?.isLastPage) break;
    page += 1;
  }
  return out;
}

export function diffNights(dateFrom, dateTo) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const ms = end - start;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Aggregate revenue per venue since a cutoff date.
 * Revenue = venue.price * nights for each booking on that venue.
 */
export function aggregateHolidaze({ venues, bookings, sinceISO = "2024-01-01" }) {
  const since = new Date(`${sinceISO}T00:00:00Z`);
  const vMap = new Map(venues.map((v) => [v.id, v]));
  const agg = new Map(
    venues.map((v) => [
      v.id,
      {
        venueId: v.id,
        venueName: v.name,
        price: v.price,
        location: v.location,
        totalBookingsSince2024: 0,
        totalRevenueSince2024: 0,
      },
    ]),
  );

  for (const b of bookings) {
    const venueId = b.venue?.id || b.venueId || b.venue_id || b.venueID; // tolerant
    const v = vMap.get(venueId);
    if (!v) continue;
    const from = new Date(b.dateFrom);
    const to = new Date(b.dateTo);
    if (!(from instanceof Date) || !(to instanceof Date) || Number.isNaN(from) || Number.isNaN(to))
      continue;
    if (to < since) continue;

    const nights = diffNights(from, to);
    const revenue = (v.price || 0) * nights;

    const cur = agg.get(venueId);
    cur.totalBookingsSince2024 += 1;
    cur.totalRevenueSince2024 += revenue;
  }

  const list = Array.from(agg.values());
  list.sort(
    (a, b) =>
      b.totalRevenueSince2024 - a.totalRevenueSince2024 ||
      b.totalBookingsSince2024 - a.totalBookingsSince2024,
  );
  return list;
}

// -------------------- Example orchestrators --------------------
/**
 * Load all venues with a single pass of pagination.
 */
export async function loadAllVenues() {
  return getAllPages((page) =>
    getVenues({ page, limit: 100, includeOwner: false, includeBookings: false }),
  );
}

/**
 * Load all bookings for the authenticated user/account.
 */
export async function loadAllBookings({ token, apiKey }) {
  return getAllPages((page) =>
    getBookings({ token, apiKey, page, limit: 100, includeVenue: true }),
  );
}

// Path: src/pages/NoroffHolidazeDashboard.jsx
// React UI using Tailwind to visualize aggregates. Approved libs only.
import React, { useEffect, useMemo, useState } from "react";
// biome-ignore lint/suspicious/noRedeclare: <explanation>
import { aggregateHolidaze, loadAllBookings, loadAllVenues } from "../api/noroffClient";

export default function NoroffHolidazeDashboard() {
  const [token, setToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [sinceISO, setSinceISO] = useState("2024-01-01");
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function boot() {
    setError("");
    setLoading(true);
    try {
      const [v, b] = await Promise.all([
        loadAllVenues(),
        token && apiKey ? loadAllBookings({ token, apiKey }) : Promise.resolve([]),
      ]);
      setVenues(v);
      setBookings(b);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boot(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const aggregates = useMemo(
    () => aggregateHolidaze({ venues, bookings: bookings, sinceISO }),
    [venues, bookings, sinceISO],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">Noroff Holidaze – Aggregates</h1>
          <p className="text-sm text-gray-600">
            Pulls venues and authenticated bookings from the Noroff v2 API and aggregates revenue
            since 2024 (price/night × nights).
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg bg-white">
              <label className="text-xs font-medium">Access Token</label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token"
                className="mt-1 w-full border rounded px-2 py-1"
              />
            </div>
            <div className="p-3 border rounded-lg bg-white">
              <label className="text-xs font-medium">API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="X-Noroff-API-Key"
                className="mt-1 w-full border rounded px-2 py-1"
              />
            </div>
            <div className="p-3 border rounded-lg bg-white">
              <label className="text-xs font-medium">Since date</label>
              <input
                type="date"
                value={sinceISO}
                onChange={(e) => setSinceISO(e.target.value)}
                className="mt-1 w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={boot}
              className="px-3 py-2 rounded bg-gray-900 text-white hover:opacity-90"
            >
              Refresh from API
            </button>
          </div>

          {loading && <div className="text-sm text-gray-600">Loading…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </section>

        <Summary aggregates={aggregates} />
        <VenuesTable aggregates={aggregates} />
      </main>
    </div>
  );
}

function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)), url('/images/Clouds_navbar.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
        <div className="font-extrabold tracking-tight">Noroff API Dashboard</div>
      </div>
    </nav>
  );
}

function Summary({ aggregates }) {
  const totalBookings = aggregates.reduce((s, a) => s + a.totalBookingsSince2024, 0);
  const totalRevenue = aggregates.reduce((s, a) => s + a.totalRevenueSince2024, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPI title="Venues" value={aggregates.length} />
      <KPI title="Bookings (since 2024)" value={totalBookings} />
      <KPI title="Revenue" value={totalRevenue.toLocaleString()} />
      <KPI title="Top Venue" value={aggregates[0]?.venueName || "—"} />
    </div>
  );
}
function KPI({ title, value }) {
  return (
    <div className="p-4 rounded-2xl border bg-white shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function VenuesTable({ aggregates }) {
  return (
    <div className="overflow-x-auto border rounded-2xl bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Venue</th>
            <th className="text-left px-3 py-2">Location</th>
            <th className="text-right px-3 py-2">Price/night</th>
            <th className="text-right px-3 py-2">Bookings</th>
            <th className="text-right px-3 py-2">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {aggregates.map((r) => (
            <tr key={r.venueId} className="odd:bg-white even:bg-gray-50">
              <td className="px-3 py-2 font-medium">{r.venueName}</td>
              <td className="px-3 py-2 text-gray-600">{fmtLocation(r.location)}</td>
              <td className="px-3 py-2 text-right">{Number(r.price || 0).toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{r.totalBookingsSince2024}</td>
              <td className="px-3 py-2 text-right">{r.totalRevenueSince2024.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function fmtLocation(loc) {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    const parts = ["address", "city", "country"].map((k) => loc[k]).filter(Boolean);
    return parts.join(", ");
  }
  return String(loc);
}
