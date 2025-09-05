// Path: src/VenueAnalyticsApp.jsx
// React + Tailwind only (approved). No external map libs. Simple tile map using Web Mercator.
// Default export <VenueAnalyticsApp/> for drop-in preview.

import React, { useEffect, useMemo, useRef, useState } from "react";

// ------------------------------ Utilities ------------------------------
/** Why: centralize date parsing across heterogeneous schemas */
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

// ------------------------------ Demo Data (replace with real) ------------------------------
const DEMO_VENUES = [
  { id: "v1", name: "Aurora Hall", location: { city: "Oslo", lat: 59.9139, lon: 10.7522 } },
  { id: "v2", name: "Fjord Center", location: { city: "Bergen", lat: 60.3913, lon: 5.3221 } },
  { id: "v3", name: "Midnight Dome", location: { city: "Trondheim", lat: 63.4305, lon: 10.3951 } },
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

// ------------------------------ Map Math (Web Mercator) ------------------------------
const TILE_SIZE = 256;
function lonLatToWorld(lon, lat, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}
function worldToLonLat(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lon, lat };
}
function clampZoom(z) {
  return Math.max(2, Math.min(18, z));
}

// ------------------------------ Components ------------------------------
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
        <div className="ml-auto text-sm opacity-90">Since 2024 • Owner:false • Remember:false</div>
      </div>
    </nav>
  );
}

function ComponentMap() {
  // Simple ASCII map of components
  const tree = [
    `VenueAnalyticsApp`,
    `├─ Navbar`,
    `├─ MainLayout`,
    `│  ├─ FiltersPanel`,
    `│  ├─ SummaryStrip`,
    `│  ├─ ContentGrid`,
    `│  │  ├─ VenuesTable`,
    `│  │  └─ VenueMap (TileMap + Markers)`,
    `└─ Footer`,
  ].join("\n");
  return (
    <pre className="p-3 rounded-lg bg-gray-50 border text-xs leading-5 whitespace-pre">{tree}</pre>
  );
}

function FiltersPanel({
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

function SummaryStrip({ aggregates }) {
  const totalBookings = aggregates.reduce((s, a) => s + a.totalBookingsSince2024, 0);
  const totalRevenue = aggregates.reduce((s, a) => s + a.totalRevenueSince2024, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <SummaryCard title="Venues" value={aggregates.length} />
      <SummaryCard title="Bookings (since 2024)" value={totalBookings} />
      <SummaryCard title="Revenue" value={totalRevenue.toLocaleString()} />
      <SummaryCard title="Top Venue" value={aggregates[0]?.venueName || "—"} />
    </div>
  );
}
function SummaryCard({ title, value }) {
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

// ------------------------------ Tile Map ------------------------------
function VenueMap({
  center,
  zoom: initialZoom,
  markers = [],
  tileServer = "https://tile.openstreetmap.org",
}) {
  // IMPORTANT: Replace tileServer with a company-approved tiles endpoint in production.
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 400 });
  const [zoom, setZoom] = useState(clampZoom(initialZoom));
  const [{ lon, lat }, setCenter] = useState(center);
  const [drag, setDrag] = useState(null);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  function onMouseDown(e) {
    setDrag({ sx: e.clientX, sy: e.clientY, start: lonLatToWorld(lon, lat, zoom) });
  }
  function onMouseMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    const start = drag.start;
    const world = { x: start.x - dx, y: start.y - dy };
    const ll = worldToLonLat(world.x, world.y, zoom);
    setCenter(ll);
  }
  function onMouseUp() {
    setDrag(null);
  }

  function zoomIn() {
    setZoom((z) => clampZoom(z + 1));
  }
  function zoomOut() {
    setZoom((z) => clampZoom(z - 1));
  }

  // Determine tile span and offsets
  const { tiles, origin } = useMemo(() => {
    const worldCenter = lonLatToWorld(lon, lat, zoom);
    const halfW = size.w / 2,
      halfH = size.h / 2;
    const minX = worldCenter.x - halfW,
      minY = worldCenter.y - halfH;
    const maxX = worldCenter.x + halfW,
      maxY = worldCenter.y + halfH;

    const tileMinX = Math.floor(minX / TILE_SIZE),
      tileMinY = Math.floor(minY / TILE_SIZE);
    const tileMaxX = Math.floor(maxX / TILE_SIZE),
      tileMaxY = Math.floor(maxY / TILE_SIZE);

    const tiles = [];
    for (let ty = tileMinY; ty <= tileMaxY; ty++) {
      for (let tx = tileMinX; tx <= tileMaxX; tx++) {
        const left = tx * TILE_SIZE - (worldCenter.x - halfW);
        const top = ty * TILE_SIZE - (worldCenter.y - halfH);
        const z = zoom;
        const n = 2 ** z;
        // Wrap X across antimeridian
        const xWrapped = ((tx % n) + n) % n;
        if (ty < 0 || ty >= n) continue; // clamp Y
        tiles.push({
          key: `${z}/${tx}/${ty}`,
          x: left,
          y: top,
          url: `${tileServer}/${z}/${xWrapped}/${ty}.png`,
        });
      }
    }
    return {
      tiles,
      origin: { x: halfW - (worldCenter.x % TILE_SIZE), y: halfH - (worldCenter.y % TILE_SIZE) },
    };
  }, [lon, lat, zoom, size.w, size.h, tileServer]);

  const markerPixels = useMemo(() => {
    return markers
      .map((m) => {
        if (typeof m.lat !== "number" || typeof m.lon !== "number") return null;
        const wp = lonLatToWorld(m.lon, m.lat, zoom);
        const centerWP = lonLatToWorld(lon, lat, zoom);
        const px = { left: wp.x - centerWP.x + size.w / 2, top: wp.y - centerWP.y + size.h / 2 };
        return { ...m, px };
      })
      .filter(Boolean);
  }, [markers, lon, lat, zoom, size]);

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border bg-gray-100">
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseUp}
        onMouseUp={onMouseUp}
      >
        {tiles.map((t) => (
          <img
            key={t.key}
            src={t.url}
            alt=""
            draggable={false}
            className="absolute select-none"
            style={{ left: t.x, top: t.y, width: TILE_SIZE, height: TILE_SIZE }}
          />
        ))}
        {markerPixels.map((m) => (
          <button
            key={`${m.venueId}-${m.px.left}-${m.px.top}`}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: m.px.left, top: m.px.top }}
            title={m.label || m.venueName}
          >
            <div className="w-3 h-3 rounded-full bg-black/80 border border-white" />
            <div className="px-1 py-0.5 mt-1 rounded bg-white/90 text-[10px] shadow">
              {m.label || m.venueName}
            </div>
          </button>
        ))}
      </div>
      <div className="absolute right-2 top-2 flex flex-col">
        <button onClick={zoomIn} className="px-2 py-1 bg-white rounded shadow border text-sm">
          +
        </button>
        <button onClick={zoomOut} className="mt-1 px-2 py-1 bg-white rounded shadow border text-sm">
          −
        </button>
      </div>
      <div className="absolute left-2 bottom-2 text-[10px] bg-white/80 rounded px-1">
        Tiles © OpenStreetMap — replace with approved server
      </div>
    </div>
  );
}

// ------------------------------ App ------------------------------
export default function VenueAnalyticsApp({ venues = DEMO_VENUES, bookings = DEMO_BOOKINGS }) {
  const [sinceISO, setSinceISO] = useState("2024-01-01");
  const [excludeOwnerTrue, setExcludeOwnerTrue] = useState(true);
  const [requireRememberFalse, setRequireRememberFalse] = useState(true);
  const since = useMemo(() => new Date(`${sinceISO}T00:00:00`), [sinceISO]);

  const aggregates = useMemo(
    () => aggregateVenues(venues, bookings, since, { excludeOwnerTrue, requireRememberFalse }),
    [venues, bookings, since, excludeOwnerTrue, requireRememberFalse],
  );

  // Build markers from venues with coords
  const markers = useMemo(
    () =>
      aggregates
        .map((a) => ({
          venueId: a.venueId,
          venueName: a.venueName,
          label: `${a.venueName} (${a.totalBookingsSince2024})`,
          lat: Number(venues.find((v) => v.id === a.venueId)?.location?.lat ?? NaN),
          lon: Number(venues.find((v) => v.id === a.venueId)?.location?.lon ?? NaN),
        }))
        .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lon)),
    [aggregates, venues],
  );

  const mapCenter = markers[0]
    ? { lat: markers[0].lat, lon: markers[0].lon }
    : { lat: 59.9139, lon: 10.7522 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Components & Map</h1>
          <p className="text-sm text-gray-600">
            Below is the component map and an interactive tile map rendering venue markers. Swap
            demo data with your real arrays.
          </p>
          <ComponentMap />
        </section>

        <section className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/5 space-y-4">
            <FiltersPanel
              {...{
                sinceISO,
                setSinceISO,
                excludeOwnerTrue,
                setExcludeOwnerTrue,
                requireRememberFalse,
                setRequireRememberFalse,
              }}
            />
            <SummaryStrip aggregates={aggregates} />
          </div>
          <div className="md:w-3/5">
            <VenueMap center={mapCenter} zoom={6} markers={markers} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Venues</h2>
          <VenuesTable aggregates={aggregates} />
        </section>

        <footer className="text-xs text-gray-500">
          <p>
            Uses only approved resources (React + Tailwind). Map tiles are from OpenStreetMap for
            demo — replace with a company-approved endpoint.
          </p>
        </footer>
      </main>
    </div>
  );
}
