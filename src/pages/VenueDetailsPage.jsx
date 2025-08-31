// src/pages/VenueDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookingCalendar from "../components/BookingCalendar";

import { getVenue } from "../api/venues";
import { createBooking } from "../api/bookings";
import { checkAvailability } from "../logic/checkAvailability";
import { buildDisabledRanges } from "../utils/availability";

function toIsoZMidnight(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString();
}

function fmt(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function VenueDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed, loading: authLoading, token, apiKey } = useAuth(); // token needed for POST
  const auth = { token, apiKey };

  const [venue, setVenue] = useState(null);
  const [status, setStatus] = useState("idle"); // idle|loading|error

  // booking UI
  const [range, setRange] = useState({ from: null, to: null });
  const [guests, setGuests] = useState(1);
  const [bookState, setBookState] = useState({ submitting: false, error: "", success: "" });

  // Fetch details with owner + bookings
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setStatus("loading");
        const res = await getVenue(id, { withBookings: true, withOwner: true }, auth);
        const data = res?.data?.data;
        if (on) {
          setVenue(data || null);
          setStatus("idle");
        }
      } catch (err) {
        console.error("❌ details fetch failed", err);
        if (on) setStatus("error");
      }
    })();
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, apiKey]); // re-run if key changes to ensure header

  const image =
    venue?.media?.[0]?.url ||
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
  const rating = venue?.rating ?? 0;
  const { city = "", country = "" } = venue?.location || {};
  const maxGuests = Number(venue?.maxGuests ?? 1);

  function validate() {
    if (!range?.from || !range?.to) return "Please select both start and end dates.";
    if (!guests || guests < 1) return "Guests must be at least 1.";
    if (maxGuests && guests > maxGuests) return `Max guests for this venue is ${maxGuests}.`;
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

    const dateFrom = toIsoZMidnight(range.from);
    const dateTo = toIsoZMidnight(range.to);

    try {
      // Preflight (live) availability
      const { ok, conflict } = await checkAvailability({ venueId: id, dateFrom, dateTo, auth });
      if (!ok) {
        setBookState({
          submitting: false,
          error: `Those dates are already booked (${fmt(conflict.dateFrom)} → ${fmt(conflict.dateTo)}).`,
          success: "",
        });
        return;
      }

      // Create
      const payload = { venueId: id, dateFrom, dateTo, guests: Number(guests) };
      const res = await createBooking(payload, auth);
      console.log("[booking] created", res?.data);

      // Optimistic: reflect success & redirect
      setBookState({ submitting: false, error: "", success: "Booking confirmed!" });
      setTimeout(() => navigate("/profile"), 600);
    } catch (err) {
      console.error("[booking] failed", err);
      const apiMsg = err?.response?.data?.errors?.[0]?.message || err?.message || "Booking failed";
      setBookState({ submitting: false, error: apiMsg, success: "" });
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
        <h1 className="text-3xl md:text-4xl font-bold truncate content-break">{venue?.name}</h1>
        <p className="name text-gray-600">
          ★ {rating.toFixed(1)} • {city}
          {city && country ? ", " : ""} {country}
        </p>
      </header>
      {venue?.owner?.name && (
        <p className="text-sm text-gray-600">
          Hosted by{" "}
          <Link to={`/users/${venue.owner.name}`} className="underline text-blue-600">
            {venue.owner.name}
          </Link>
        </p>
      )}
      <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[16/9]">
        <img src={image} alt={venue?.name || "Venue"} className="w-full h-full object-cover" />
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">About this place</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {venue?.description || "No description yet."}
          </p>

          {Array.isArray(venue?.amenities) && venue.amenities.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-4">Amenities</h3>
              <ul className="list-disc pl-5 space-y-1">
                {venue.amenities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          )}

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
          {Number.isFinite(venue?.price) && (
            <p className="text-2xl">
              <span className="font-bold">${venue.price}</span>{" "}
              <span className="text-gray-600 text-base">/ night</span>
            </p>
          )}

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
              <div className="space-y-2">
                <span className="block text-sm font-medium">Choose dates</span>
                <BookingCalendar
                  bookings={buildDisabledRanges(venue?.bookings || [])}
                  selected={range}
                  onSelect={setRange}
                  minDate={new Date()}
                />
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
