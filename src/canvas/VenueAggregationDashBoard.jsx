// Path: src/components/VenueAggregationDashboard.jsx
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
// React + Tailwind only (approved). No unapproved libs. Uses IndexedDB for on-device DB sorting.
import React, { useMemo, useState } from "react";

/**
 * Why: Allow flexible mapping of source fields from heterogeneous schemas.
 */
const BOOKING_DATE_FIELDS = [
  "startDate",
  "start_at",
  "start",
  "checkIn",
  "check_in",
  "createdAt",
  "created_at",
  "date",
];
const PRICE_FIELDS = ["price", "totalPrice", "total_amount", "amount"];

/** @typedef {{ id: string, name?: string, title?: string, location?: any, address?: any }} Venue */
/** @typedef {{ id?: string, venueId: string, owner?: boolean, remember?: boolean, currency?: string }} Booking */

/**
 * @param {any} x
 * @returns {Date|null}
 */
function toDate(x) {
  if (!x) return null;
  if (x instanceof Date) return x;
  if (typeof x === "object" && typeof x.toDate === "function") return x.toDate();
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {Record<string, any>} obj
 * @param {string[]} fields
 */
function getFirstExisting(obj, fields) {
  for (const f of fields) if (Object.hasOwn(obj, f) && obj[f] != null) return obj[f];
  return undefined;
}

function extractBookingDate(data) {
  return toDate(getFirstExisting(data, BOOKING_DATE_FIELDS));
}

function extractPrice(data) {
  const direct = getFirstExisting(data, PRICE_FIELDS);
  if (typeof direct === "number") return { amount: direct, currency: data.currency ?? null };
  if (typeof direct === "string" && !Number.isNaN(Number(direct)))
    return { amount: Number(direct), currency: data.currency ?? null };
  if (direct && typeof direct === "object") {
    const amount = Number(direct.amount ?? direct.value ?? NaN);
    const currency = direct.currency ?? data.currency ?? null;
    if (!Number.isNaN(amount)) return { amount, currency };
  }
  return { amount: 0, currency: data.currency ?? null };
}

/**
 * Aggregate per venue.
 * Why: Keep zeros so "every venue" appears even with no bookings.
 * @param {Venue[]} venues
 * @param {(Booking & Record<string, any>)[]} bookings
 * @param {Date} since
 * @param {{ excludeOwnerTrue: boolean, requireRememberFalse: boolean }} opts
 */
function aggregateVenues(venues, bookings, since, opts) {
  const base = new Map();
  for (const v of venues) {
    base.set(v.id, {
      venueId: v.id,
      venueName: v.name || v.title || `venue:${v.id}`,
      location: v.location ?? v.address ?? null,
      totalBookingsSince2024: 0,
      totalRevenueSince2024: 0,
      currency: null,
    });
  }

  for (const b of bookings) {
    if (!base.has(b.venueId)) continue; // ignore unknown venue
    if (opts.excludeOwnerTrue && b.owner === true) continue;
    if (opts.requireRememberFalse && b.remember !== false) continue;

    const d = extractBookingDate(b);
    if (!d || d < since) continue;

    const { amount, currency } = extractPrice(b);
    const agg = base.get(b.venueId);
    agg.totalBookingsSince2024 += 1;
    if (Number.isFinite(amount) && amount > 0) agg.totalRevenueSince2024 += amount;
    if (!agg.currency && currency) agg.currency = currency;
  }

  return Array.from(base.values()).sort((a, b) => {
    const rev = b.totalRevenueSince2024 - a.totalRevenueSince2024;
    return rev !== 0 ? rev : b.totalBookingsSince2024 - a.totalBookingsSince2024;
  });
}

// ---------------- IndexedDB (no external libs) ----------------
const DB_NAME = "venueAnalytics";
const STORE = "venueAggregates";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.createObjectStore(STORE, { keyPath: "venueId" });
      store.createIndex("totalRevenueSince2024", "totalRevenueSince2024", { unique: false });
      store.createIndex("totalBookingsSince2024", "totalBookingsSince2024", { unique: false });
      // Why: allow querying highest revenue efficiently via reverse cursor.
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAggregates(aggregates) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    for (const r of aggregates) st.put({ ...r, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function clearAggregates() {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * @param {number} limit
 * @returns {Promise<any[]>}
 */
async function topByRevenue(limit = 10) {
  const db = await openDB();
  const out = [];
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("totalRevenueSince2024");
    const cursorReq = idx.openCursor(null, "prev"); // highest first
    cursorReq.onsuccess = (e) => {
      /** @type {IDBCursorWithValue|null} */
      const cursor = e.target.result;
      if (!cursor || out.length >= limit) return resolve();
      out.push(cursor.value);
      cursor.continue();
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
  db.close();
  return out;
}

// ---------------- UI ----------------
export default function VenueAggregationDashboard({
  venues: initialVenues,
  bookings: initialBookings,
}) {
  const [sinceISO, setSinceISO] = useState("2024-01-01");
  const [excludeOwnerTrue, setExcludeOwnerTrue] = useState(true);
  const [requireRememberFalse, setRequireRememberFalse] = useState(true);

  // Demo data if none passed in
  const venues = initialVenues ?? [
    { id: "v1", name: "Aurora Hall", location: { city: "Oslo" } },
    { id: "v2", name: "Fjord Center", location: { city: "Bergen" } },
    { id: "v3", name: "Midnight Dome", location: { city: "Trondheim" } },
  ];
  const bookings = initialBookings ?? [
    {
      venueId: "v1",
      owner: false,
      remember: false,
      price: 1200,
      currency: "NOK",
      createdAt: "2024-02-15",
    },
    {
      venueId: "v1",
      owner: true,
      remember: false,
      price: 900,
      currency: "NOK",
      createdAt: "2024-03-01",
    },
    {
      venueId: "v2",
      owner: false,
      remember: false,
      totalPrice: { amount: 3400, currency: "NOK" },
      startDate: "2024-07-10",
    },
    { venueId: "v2", owner: false, remember: true, price: 500, created_at: "2024-04-02" },
    {
      venueId: "v3",
      owner: false,
      remember: false,
      amount: "1500",
      currency: "NOK",
      start: "2025-01-12",
    },
  ];

  const since = useMemo(() => new Date(`${sinceISO}T00:00:00`), [sinceISO]);

  const aggregates = useMemo(
    () => aggregateVenues(venues, bookings, since, { excludeOwnerTrue, requireRememberFalse }),
    [venues, bookings, since, excludeOwnerTrue, requireRememberFalse],
  );

  const [dbTop, setDbTop] = useState([]);

  function downloadCSV(rows) {
    const headers = [
      "venueId",
      "venueName",
      "totalBookingsSince2024",
      "totalRevenueSince2024",
      "currency",
    ];
    const csv = [headers.join(",")]
      .concat(
        rows.map((r) =>
          [
            r.venueId,
            esc(r.venueName),
            r.totalBookingsSince2024,
            r.totalRevenueSince2024,
            r.currency ?? "",
          ].join(","),
        ),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "venue_aggregates.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function esc(s) {
    return String(s).replaceAll('"', '""');
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold">Venue Aggregation Dashboard</h1>
          <p className="text-sm text-gray-600">
            Lists every venue with total bookings & revenue since 2024. Filters out owner bookings
            and requires <code>remember === false</code> by default.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">Since</span>
            <input
              type="date"
              value={sinceISO}
              onChange={(e) => setSinceISO(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={excludeOwnerTrue}
              onChange={(e) => setExcludeOwnerTrue(e.target.checked)}
            />
            <span>Exclude owner===true</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireRememberFalse}
              onChange={(e) => setRequireRememberFalse(e.target.checked)}
            />
            <span>Require remember===false</span>
          </label>
        </div>
      </header>

      <section className="flex flex-wrap gap-2">
        <button
          onClick={() => saveAggregates(aggregates)}
          className="px-3 py-2 rounded bg-gray-900 text-white hover:opacity-90"
        >
          Save aggregates to DB
        </button>
        <button
          onClick={async () => setDbTop(await topByRevenue(10))}
          className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Load top 10 by revenue (DB)
        </button>
        <button
          onClick={async () => {
            await clearAggregates();
            setDbTop([]);
          }}
          className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Clear DB
        </button>
        <button
          onClick={() => downloadCSV(aggregates)}
          className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Export CSV
        </button>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Aggregated (memory)</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2">Venue</th>
                <th className="text-left px-3 py-2">Location</th>
                <th className="text-right px-3 py-2">Bookings</th>
                <th className="text-right px-3 py-2">Revenue</th>
                <th className="text-left px-3 py-2">Currency</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((r) => (
                <tr key={r.venueId} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{r.venueName}</td>
                  <td className="px-3 py-2 text-gray-600">{fmtLocation(r.location)}</td>
                  <td className="px-3 py-2 text-right">{r.totalBookingsSince2024}</td>
                  <td className="px-3 py-2 text-right">
                    {r.totalRevenueSince2024.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{r.currency ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Top (from DB)</h2>
        {dbTop.length === 0 ? (
          <p className="text-gray-600 text-sm">
            No cached aggregates yet. Click "Save aggregates to DB" then "Load top 10".
          </p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Venue</th>
                  <th className="text-right px-3 py-2">Bookings</th>
                  <th className="text-right px-3 py-2">Revenue</th>
                  <th className="text-left px-3 py-2">Currency</th>
                </tr>
              </thead>
              <tbody>
                {dbTop.map((r) => (
                  <tr key={r.venueId} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{r.venueName}</td>
                    <td className="px-3 py-2 text-right">{r.totalBookingsSince2024}</td>
                    <td className="px-3 py-2 text-right">
                      {Number(r.totalRevenueSince2024 || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{r.currency ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="text-xs text-gray-500">
        <p>
          Data is processed client-side using approved libraries (React + Tailwind). Persisted using
          the browser's IndexedDB so you can sort in the database layer.
        </p>
      </footer>
    </div>
  );
}

function fmtLocation(loc) {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    const parts = ["name", "city", "town", "address", "country"].map((k) => loc[k]).filter(Boolean);
    return parts.join(", ");
  }
  return String(loc);
}
