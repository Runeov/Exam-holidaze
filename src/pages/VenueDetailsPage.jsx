// src/pages/VenueDetailsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getVenueById } from "../api/venues";
import { createBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext";

export default function VenueDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed, loading: authLoading } = useAuth();

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

  useEffect(() => {
    async function run() {
      try {
        setStatus("loading");
        const v = await getVenueById(id);
        setVenue(v);
        setStatus("idle");
      } catch (e) {
        console.error("❌ details fetch failed", e);
        setStatus("error");
      }
    }
    run();
  }, [id]);

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
      const payload = {
        venueId: id,
        dateFrom: new Date(dateFrom).toISOString(),
        dateTo: new Date(dateTo).toISOString(),
        guests: Number(guests),
      };
      const created = await createBooking(payload);
      console.log("[booking] created", created);
      setBookState({ submitting: false, error: "", success: "Booking confirmed!" });

      // brief success, then go to profile to verify it appears
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
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">
                  <span className="block mb-1">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="block mb-1">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </label>
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
