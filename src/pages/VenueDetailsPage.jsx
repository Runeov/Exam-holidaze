// src/pages/VenueDetailsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { createBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import BookingCalendar from "../components/BookingCalendar";

// --- tiny utils (local to this page) -------------------------------
const API = "https://v2.api.noroff.dev";

function toIsoZMidnight(date) {
  if (!date) return "";
  const d = new Date(date);
  // Use UTC midnight to avoid TZ drift when sending to API
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString();
}

/** Normalize any date-like input to UTC midnight for safe comparisons */
function toUtcMidnight(d) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

/** Treat ranges as [start, end) — end is exclusive */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const A1 = toUtcMidnight(aStart);
  const A2 = toUtcMidnight(aEnd);
  const B1 = toUtcMidnight(bStart);
  const B2 = toUtcMidnight(bEnd);
  return A1 < B2 && B1 < A2;
}

function hasBookingConflict(bookings = [], dateFrom, dateTo) {
  return bookings.some((b) => rangesOverlap(dateFrom, dateTo, b.dateFrom, b.dateTo));
}

function fmt(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
// -------------------------------------------------------------------

export default function VenueDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed, loading: authLoading, apiKey } = useAuth();

  const [venue, setVenue] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [bookState, setBookState] = useState({
    submitting: false,
    error: "",
    success: "",
  });

  // form fields
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [guests, setGuests] = useState(1);
  // calendar range selection (controlled in this component)
  const [range, setRange] = useState({ from: null, to: null });
  function handleRangeSelect(next) {
    setRange(next || { from: null, to: null });
    if (!next?.from || !next?.to) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    setDateFrom(toIsoZMidnight(next.from));
    setDateTo(toIsoZMidnight(next.to));
  }

  // Load venue WITH bookings so we can block overlaps
  useEffect(() => {
    async function run() {
      try {
        setStatus("loading");
        const res = await fetch(`${API}/holidaze/venues/${id}?_bookings=true`, {
          headers: apiKey ? { "X-Noroff-API-Key": apiKey } : undefined,
        });
        if (!res.ok) throw new Error(`Failed to fetch venue (${res.status})`);
        const { data } = await res.json();
        setVenue(data);
        setStatus("idle");
      } catch (e) {
        console.error("❌ details fetch failed", e);
        setStatus("error");
      }
    }
    run();
  }, [id, apiKey]);

  const image =
    venue?.media?.[0]?.url ||
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
  const rating = venue?.rating ?? 0;
  const { city = "", country = "" } = venue?.location || {};
  const maxGuests = useMemo(() => Number(venue?.maxGuests ?? 1), [venue]);

  function validate() {
    if (!dateFrom || !dateTo) return "Please select both start and end dates.";
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) return "Start date cannot be in the past.";
    if (end <= start) return "End date must be after start date.";
    if (!guests || guests < 1) return "Guests must be at least 1.";
    if (maxGuests && guests > maxGuests) return `Max guests for this venue is ${maxGuests}.`;

    // Local overlap check against the bookings we already loaded
    if (Array.isArray(venue?.bookings) && hasBookingConflict(venue.bookings, dateFrom, dateTo)) {
      return "Those dates overlap an existing booking.";
    }

    return "";
  }

  async function onBook(e) {
    e.preventDefault();
    setBookState({ submitting: true, error: "", success: "" });

    const msg = validate();
    if (msg) {
      setBookState({ submitting: false, error: msg, success: "" });
      return;
    }

    try {
      // --- server-side preflight: re-fetch latest bookings to avoid race conditions
      const pre = await fetch(`${API}/holidaze/venues/${id}?_bookings=true`, {
        headers: apiKey ? { "X-Noroff-API-Key": apiKey } : undefined,
      });
      if (!pre.ok) throw new Error(`Preflight failed (${pre.status})`);
      const { data: freshVenue } = await pre.json();

      if (hasBookingConflict(freshVenue.bookings || [], dateFrom, dateTo)) {
        setBookState({
          submitting: false,
          error: "Those dates were just booked by someone else. Please pick different dates.",
          success: "",
        });
        return;
      }

      // proceed with creation
      const payload = {
        venueId: id,
        dateFrom: new Date(dateFrom).toISOString(),
        dateTo: new Date(dateTo).toISOString(),
        guests: Number(guests),
      };

      const created = await createBooking(payload);
      console.log("[booking] created", created);
      setBookState({ submitting: false, error: "", success: "Booking confirmed!" });

      setTimeout(() => navigate("/profile"), 600);
    } catch (err) {
      console.error("[booking] failed", err);
      setBookState({
        submitting: false,
        error: err?.response?.data?.errors?.[0]?.message || err?.message || "Booking failed",
        success: "",
      });
    }
  }

  if (status === "loading") return <p className="p-6">Loading venue…</p>;
  if (status === "error") return <p className="p-6 text-red-600">Couldn’t load this venue.</p>;
  if (!venue) return <p className="p-6">No venue found.</p>;

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <Link to="/venues" className="text-sm underline">
          ← Back to all venues
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold">{venue?.name}</h1>
        <p className="text-gray-600">
          ★ {rating.toFixed(1)} • {city}
          {city && country ? ", " : ""}
          {country}
        </p>
      </header>

      <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[16/9]">
        <img src={image} alt={venue?.name || "Venue"} className="w-full h-full object-cover" />
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">About this place</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {venue?.description || "No description yet."}
          </p>

          {Array.isArray(venue?.amenities) && venue.amenities.length > 0 ? (
            <>
              <h3 className="text-lg font-semibold mt-4">Amenities</h3>
              <ul className="list-disc pl-5 space-y-1">
                {venue.amenities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          ) : null}

          {/* Quick visual of booked ranges to help the user pick dates */}
          {Array.isArray(venue?.bookings) && venue.bookings.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6">Already booked</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                {venue.bookings
                  .slice()
                  .sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom))
                  .map((b) => (
                    <li key={b.id}>
                      {fmt(b.dateFrom)} → {fmt(b.dateTo)} ({b.guests} guest
                      {b.guests === 1 ? "" : "s"})
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>

        <aside className="md:col-span-1 p-4 border rounded-2xl bg-white space-y-3">
          {venue?.price ? (
            <p className="text-2xl">
              <span className="font-bold">${venue.price}</span>{" "}
              <span className="text-gray-600 text-base">/ night</span>
            </p>
          ) : null}

          {/* Booking form */}
          {!authLoading && !isAuthed && (
            <div className="text-sm">
              <p className="mb-2">You must be logged in to book.</p>
              <Link
                to="/login"
                className="inline-block w-full text-center py-3 rounded-xl bg-gray-900 text-white font-semibold"
              >
                Log in to book
              </Link>
            </div>
          )}

          {isAuthed && (
            <form onSubmit={onBook} className="space-y-3">
              {/* Calendar selection */}
              <div className="space-y-2">
                <span className="block text-sm font-medium">Choose dates</span>
                <BookingCalendar
                  bookings={venue?.bookings || []}
                  selected={range}
                  onSelect={handleRangeSelect}
                  minDate={new Date()} // today
                />
                {/* Optional: quick summary */}
                <div className="text-xs text-gray-600">
                  {range?.from && range?.to ? (
                    <>
                      Selected: {new Date(range.from).toLocaleDateString()} →{" "}
                      {new Date(range.to).toLocaleDateString()}
                    </>
                  ) : (
                    "Pick a start and end date"
                  )}
                </div>
              </div>

              <label className="text-sm block">
                <span className="block mb-1">Guests {maxGuests ? `(max ${maxGuests})` : ""}</span>
                <input
                  type="number"
                  min={1}
                  max={maxGuests || undefined}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full rounded border px-2 py-1"
                  required
                />
              </label>

              {bookState.error && <p className="text-sm text-red-600">{bookState.error}</p>}
              {bookState.success && <p className="text-sm text-green-700">{bookState.success}</p>}

              <button
                type="submit"
                disabled={bookState.submitting}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold disabled:opacity-60"
              >
                {bookState.submitting ? "Booking…" : "Book now"}
              </button>
              <p className="text-xs text-gray-500">
                You’ll be redirected to your profile after booking.
              </p>
            </form>
          )}
        </aside>
      </section>
    </div>
  );
}
