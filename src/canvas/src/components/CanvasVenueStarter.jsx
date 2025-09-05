// Path: src/CanvasVenueStarter.jsx
// Default export: <CanvasVenueStarter/> (React + Tailwind only)
// Pseudocode (plan):
// 1) Navbar: sticky with bg image from /public/images/Clouds_navbar.png (contrast overlay).
// 2) Inputs: since date (>= 2024-01-01), flags: owner===false, remember===false.
// 3) Aggregate: iterate venues & bookings; filter by flags & date; count bookings; sum price; keep currency.
// 4) Present: summary KPIs, table sorted by revenue desc, simple grid map that places markers by lat/lon.
// 5) Extensible: replace demo data with real arrays via props later; keep util functions reusable.

import React, { useMemo, useState } from "react";

// ---------------- Utilities ----------------
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

function toDate(x) {
  if (!x) return null;
  if (x instanceof Date) return x;
  if (typeof x === "object" && typeof x.toDate === "function") return x.toDate();
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d;
}
function getFirst(obj, fields) {
  for (const f of fields) {
    if (Object.hasOwn(obj, f) && obj[f] != null) return obj[f];
  }
}
function extractBookingDate(b) {
  return toDate(getFirst(b, BOOKING_DATE_FIELDS));
}
function extractPrice(b) {
  const direct = getFirst(b, PRICE_FIELDS);
  if (typeof direct === "number") return { amount: direct, currency: b.currency ?? null };
  if (typeof direct === "string" && !Number.isNaN(Number(direct)))
    return { amount: Number(direct), currency: b.currency ?? null };
  if (direct && typeof direct === "object") {
    const amount = Number(direct.amount ?? direct.value ?? NaN);
    const currency = direct.currency ?? b.currency ?? null;
    if (!Number.isNaN(amount)) return { amount, currency };
  }
  return { amount: 0, currency: b.currency ?? null };
}

function aggregateVenues(venues, bookings, since, { excludeOwnerTrue, requireRememberFalse }) {
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
    if (!base.has(b.venueId)) continue;
    if (excludeOwnerTrue && b.owner === true) continue;
    if (requireRememberFalse && b.remember !== false) continue;
    const d = extractBookingDate(b);
    if (!d || d < since) continue;
    const { amount, currency } = extractPrice(b);
    const agg = base.get(b.venueId);
    agg.totalBookingsSince2024 += 1;
    if (Number.isFinite(amount) && amount > 0) agg.totalRevenueSince2024 += amount;
    if (!agg.currency && currency) agg.currency = currency;
  }
  return Array.from(base.values()).sort(
    (a, b) =>
      b.totalRevenueSince2024 - a.totalRevenueSince2024 ||
      b.totalBookingsSince2024 - a.totalBookingsSince2024,
  );
}

// ---------------- Demo Data (replace with real) ----------------
const DEMO_VENUES = [
  {
    id: "v1",
    name: "Aurora Hall",
    location: { city: "Oslo", country: "NO", lat: 59.9139, lon: 10.7522 },
  },
  {
    id: "v2",
    name: "Fjord Center",
    location: { city: "Bergen", country: "NO", lat: 60.3913, lon: 5.3221 },
  },
  {
    id: "v3",
    name: "Midnight Dome",
    location: { city: "Trondheim", country: "NO", lat: 63.4305, lon: 10.3951 },
  },
];
const DEMO_BOOKINGS = [
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
  {
    venueId: "v2",
    owner: false,
    remember: true,
    price: 500,
    currency: "NOK",
    created_at: "2024-04-02",
  },
  {
    venueId: "v3",
    owner: false,
    remember: false,
    amount: "1500",
    currency: "NOK",
    start: "2025-01-12",
  },
];

// ---------------- UI Components ----------------
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
        <div className="font-extrabold tracking-tight">Venue Analytics</div>
        <div className="ml-auto text-sm opacity-90">Since 2024 • owner:false • remember:false</div>
      </div>
    </nav>
  );
}

function Filters({
  sinceISO,
  setSinceISO,
  excludeOwnerTrue,
  setExcludeOwnerTrue,
  requireRememberFalse,
  setRequireRememberFalse,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
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
              <td className="px-3 py-2 text-right">{r.totalRevenueSince2024.toLocaleString()}</td>
              <td className="px-3 py-2">{r.currency ?? ""}</td>
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
    const parts = ["name", "city", "town", "address", "country"].map((k) => loc[k]).filter(Boolean);
    return parts.join(", ");
  }
  return String(loc);
}

// ---------------- Grid Map (no external tiles/services) ----------------
function GridMap({ venues }) {
  const withCoords = venues.filter(
    (v) => Number.isFinite(v.location?.lat) && Number.isFinite(v.location?.lon),
  );
  if (withCoords.length === 0)
    return (
      <div className="h-64 rounded-2xl border bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        No coordinates to display
      </div>
    );

  const lats = withCoords.map((v) => v.location.lat),
    lons = withCoords.map((v) => v.location.lon);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLon = Math.min(...lons),
    maxLon = Math.max(...lons);

  function toXY(lat, lon) {
    const x = (lon - minLon) / Math.max(1e-9, maxLon - minLon);
    const y = 1 - (lat - minLat) / Math.max(1e-9, maxLat - minLat);
    return { x, y };
  }

  return (
    <div
      className="relative h-[420px] w-full rounded-2xl border overflow-hidden"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, #f5f5f5 0 24px, #efefef 24px 25px), repeating-linear-gradient(90deg, #f5f5f5 0 24px, #efefef 24px 25px)",
      }}
    >
      {withCoords.map((v) => {
        const { x, y } = toXY(v.location.lat, v.location.lon);
        return (
          <div
            key={v.id}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `calc(${(x * 100).toFixed(4)}% )`,
              top: `calc(${(y * 100).toFixed(4)}% )`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-black/80 border border-white" />
            <div className="px-1 py-0.5 mt-1 rounded bg-white/90 text-[10px] shadow whitespace-nowrap">
              {v.name || v.title || v.id}
            </div>
          </div>
        );
      })}
      <div className="absolute left-2 bottom-2 text-[10px] bg-white/80 rounded px-1">
        Grid map (normalized lat/lon)
      </div>
    </div>
  );
}

// ---------------- App ----------------
export default function CanvasVenueStarter({ venues = DEMO_VENUES, bookings = DEMO_BOOKINGS }) {
  const [sinceISO, setSinceISO] = useState("2024-01-01");
  const [excludeOwnerTrue, setExcludeOwnerTrue] = useState(true);
  const [requireRememberFalse, setRequireRememberFalse] = useState(true);
  const since = useMemo(() => new Date(`${sinceISO}T00:00:00`), [sinceISO]);

  const aggregates = useMemo(
    () => aggregateVenues(venues, bookings, since, { excludeOwnerTrue, requireRememberFalse }),
    [venues, bookings, since, excludeOwnerTrue, requireRememberFalse],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">Canvas Starter</h1>
          <p className="text-sm text-gray-600">
            This is the minimal, approved-libs starter on canvas. Swap demo arrays with your real{" "}
            <code>venues</code> and <code>venue_bookings</code> later.
          </p>
          <Filters
            {...{
              sinceISO,
              setSinceISO,
              excludeOwnerTrue,
              setExcludeOwnerTrue,
              requireRememberFalse,
              setRequireRememberFalse,
            }}
          />
          <Summary aggregates={aggregates} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Map</h2>
          <GridMap venues={venues} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Venues (Aggregated)</h2>
          <VenuesTable aggregates={aggregates} />
        </section>

        <footer className="text-xs text-gray-500">
          <p>
            Uses only approved resources (React + Tailwind). Navbar uses{" "}
            <code>/public/images/Clouds_navbar.png</code>.
          </p>
        </footer>
      </main>
    </div>
  );
}
