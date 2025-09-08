// package.json
// -----------------
// Path: package.json
{
  ("name");
  : "venue-aggregation",
  "version": "1.0.0",
  "private": true,
  "main": "src/aggregateVenueBookings.js",
  "scripts":
  ("start");
  : "node src/aggregateVenueBookings.js"
  ,
  "dependencies":
  ("firebase-admin");
  : "^12.5.0"
}

// src/aggregateVenueBookings.js
// ------------------------------
// Path: src/aggregateVenueBookings.js
// Aggregates total bookings & revenue per venue since 2024-01-01,
// excluding owner bookings (owner === false), then stores results in
// Firestore collection `venue_aggregates` for easy sorting later.

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// ---- Config (override via env if needed) ----
const CONFIG = {
  SINCE_ISO: process.env.SINCE_ISO || "2024-01-01T00:00:00.000Z",
  BOOKINGS_COLLECTION: process.env.BOOKINGS_COLLECTION || "venue_bookings",
  VENUE_SUBCOLLECTION: process.env.VENUE_SUBCOLLECTION || "bookings",
  OUTPUT_COLLECTION: process.env.OUTPUT_COLLECTION || "venue_aggregates",
  // What date fields to inspect on each booking (ordered by priority)
  BOOKING_DATE_FIELDS: (
    process.env.BOOKING_DATE_FIELDS ||
    "startDate,start_at,start,checkIn,check_in,createdAt,created_at,date"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  // What price fields to inspect on each booking
  PRICE_FIELDS: (process.env.PRICE_FIELDS || "price,totalPrice,total_amount,amount")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

// ---- Firebase Admin initialization ----
function initFirebase() {
  if (admin.apps.length) return;

  try {
    // Prefer explicit service account env triplet
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      return;
    }

    // Next, try GOOGLE_APPLICATION_CREDENTIALS path
    const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (gac && fs.existsSync(gac)) {
      const sa = JSON.parse(fs.readFileSync(gac, "utf8"));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      return;
    }

    // Fallback to ADC (e.g., on Cloud Run/Functions/GCE)
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err);
    process.exit(1);
  }
}

// ---- Utilities ----
function toDate(x) {
  if (!x) return null;
  // Firestore Timestamp
  if (typeof x === "object" && x.toDate && typeof x.toDate === "function") return x.toDate();
  // JS Date
  if (x instanceof Date) return x;
  // ISO string or number
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getFirstExisting(obj, fields) {
  for (const f of fields) {
    if (Object.hasOwn(obj, f) && obj[f] != null) return obj[f];
  }
  return undefined;
}

function extractBookingDate(data) {
  const raw = getFirstExisting(data, CONFIG.BOOKING_DATE_FIELDS);
  return toDate(raw);
}

function extractPrice(data) {
  // Supports numeric or object forms ({ amount, currency } or { value, currency })
  const direct = getFirstExisting(data, CONFIG.PRICE_FIELDS);
  if (typeof direct === "number") return { amount: direct, currency: data.currency || null };
  if (typeof direct === "string" && !Number.isNaN(Number(direct))) {
    return { amount: Number(direct), currency: data.currency || null };
  }
  if (direct && typeof direct === "object") {
    const amount = Number(direct.amount ?? direct.value ?? NaN);
    const currency = direct.currency || data.currency || null;
    if (!Number.isNaN(amount)) return { amount, currency };
  }
  return { amount: 0, currency: data.currency || null };
}

function chunk(array, size = 450) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

// ---- Core aggregation ----
async function aggregate() {
  initFirebase();
  const db = admin.firestore();
  const since = new Date(CONFIG.SINCE_ISO);
  if (Number.isNaN(since.getTime())) throw new Error(`Invalid SINCE_ISO: ${CONFIG.SINCE_ISO}`);

  const venuesSnap = await db.collection("venues").get();
  if (venuesSnap.empty) {
    console.log("No venues found.");
    return [];
  }

  const results = [];

  for (const venueDoc of venuesSnap.docs) {
    const venue = venueDoc.data() || {};
    const venueId = venueDoc.id;
    const venueName = venue.name || venue.title || `venue:${venueId}`;
    const location = venue.location ?? venue.address ?? null; // keep raw value

    // Query top-level bookings: /venue_bookings where venueId == venueId and owner == false
    const topLevelQuery = db
      .collection(CONFIG.BOOKINGS_COLLECTION)
      .where("venueId", "==", venueId)
      .where("owner", "==", false);

    // Query subcollection bookings: /venues/{venueId}/bookings where owner == false
    const subColQuery = db
      .collection("venues")
      .doc(venueId)
      .collection(CONFIG.VENUE_SUBCOLLECTION)
      .where("owner", "==", false);

    // Fetch both sources; some projects use one or the other
    const [topLevelSnap, subColSnap] = await Promise.allSettled([
      topLevelQuery.get(),
      subColQuery.get(),
    ]);

    const seenPaths = new Set();
    const bookings = [];

    function addBookings(snapResult) {
      if (snapResult.status !== "fulfilled") return;
      const snap = snapResult.value;
      snap.forEach((doc) => {
        const pathKey = doc.ref.path;
        if (seenPaths.has(pathKey)) return; // de-dup across sources
        seenPaths.add(pathKey);
        bookings.push({ id: doc.id, data: doc.data() || {} });
      });
    }

    addBookings(topLevelSnap);
    addBookings(subColSnap);

    // Filter by date >= 2024-01-01 and accumulate totals
    let count = 0;
    let revenue = 0;
    let currency = null;

    for (const b of bookings) {
      const d = extractBookingDate(b.data);
      if (!d || d < since) continue;

      // Ensure owner flag is false even if query missed it
      if (b.data.owner === true) continue;

      const { amount, currency: c } = extractPrice(b.data);
      if (c && !currency) currency = c; // why: keep the first seen currency for reporting consistency
      if (Number.isFinite(amount) && amount > 0) revenue += amount;
      count += 1;
    }

    results.push({
      venueId,
      venueName,
      location,
      totalBookingsSince2024: count,
      totalRevenueSince2024: Number(revenue.toFixed(2)),
      currency: currency || null,
    });
  }

  // Persist aggregates for sorting later
  const outCol = db.collection(CONFIG.OUTPUT_COLLECTION);
  const batches = chunk(results, 450);
  for (const group of batches) {
    const batch = db.batch();
    for (const r of group) {
      const ref = outCol.doc(r.venueId);
      batch.set(
        ref,
        { ...r, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
    await batch.commit();
  }

  // Return list sorted by revenue desc
  results.sort(
    (a, b) =>
      b.totalRevenueSince2024 - a.totalRevenueSince2024 ||
      b.totalBookingsSince2024 - a.totalBookingsSince2024,
  );

  // Pretty print to console
  console.table(
    results.map((r) => ({
      venueId: r.venueId,
      name: r.venueName,
      bookings: r.totalBookingsSince2024,
      revenue: r.totalRevenueSince2024,
      currency: r.currency || "",
    })),
  );

  console.log(
    `\nStored ${results.length} docs in \\${CONFIG.OUTPUT_COLLECTION}. You can query: orderBy('totalRevenueSince2024', 'desc').`,
  );

  return results;
}

if (require.main === module) {
  aggregate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// Notes:
// - Ensure composite indexes exist if Firestore prompts during queries (venueId + owner).
// - If your date or price fields differ, set env vars:
//   BOOKING_DATE_FIELDS="checkIn,createdAt" PRICE_FIELDS="totalPrice" BOOKINGS_COLLECTION="venue_bookings"
// - Results are stored in `venue_aggregates/{venueId}` with totals since 2024.
