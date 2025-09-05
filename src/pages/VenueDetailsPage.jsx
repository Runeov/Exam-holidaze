// src/pages/VenueDetailsPage.jsx
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBooking } from "../api/bookings";
import { getVenue } from "../api/venues";
import BookingCalendar from "../components/BookingCalendar";
import { useAuth } from "../context/AuthContext";
import { checkAvailability } from "../logic/checkAvailability";
import { buildDisabledRanges } from "../utils/availability";
import { pushFlash } from "../utils/flash";
import { get, remove, save } from "../utils/storage";

// ---------- Helpers (additive, safe) ----------
function safeDate(dateLike) {
  const t = Date.parse(dateLike);
  return Number.isFinite(t) ? new Date(t) : null;
}
function toIsoZMidnight(dateLike) {
  const d = safeDate(dateLike);
  if (!d) return "";
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString();
}
function fmt(isoOrLike) {
  const d = safeDate(isoOrLike);
  return d
    ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";
}
function fmtShort(dateLike) {
  const d = safeDate(dateLike);
  return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
}
function countNights(from, to) {
  const a = safeDate(from);
  const b = safeDate(to);
  if (!a || !b) return 0;
  const MS = 24 * 60 * 60 * 1000;
  // work in Z-midnight for stability across TZ
  const az = new Date(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()));
  const bz = new Date(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()));
  const diff = Math.round((bz - az) / MS);
  return Math.max(0, diff);
}
function clampInt(v, min, max) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, max ? Math.min(n, max) : n);
}

const PENDING_KEY = "pendingBooking";

export default function VenueDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed, loading: authLoading, token, apiKey } = useAuth();
  const auth = { token, apiKey };

  const [venue, setVenue] = useState(null);
  const [status, setStatus] = useState("idle"); // idle|loading|error

  // booking UI (SearchBar-like popover calendar)
  const [range, setRange] = useState({ from: null, to: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calWrapRef = useRef(null);
  const [guests, setGuests] = useState(1);
  const [bookState, setBookState] = useState({ submitting: false, error: "", success: "" });

  // register-then-book modal
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [autoBooking, setAutoBooking] = useState(false);

  // Restore previous title on unmount
  useEffect(() => {
    const prev = document.title;
    return () => {
      document.title = prev;
    };
  }, []);
  const priceMinId = `${uid}-price-min`;
  const priceMaxId = `${uid}-price-max`;
  // Close calendar popover when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!calWrapRef.current) return;
      if (!calWrapRef.current.contains(e.target)) setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Fetch details (accepts both {data:{data}} and {data})
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setStatus("loading");
        document.title = "Holidaze | Venue";
        const res = await getVenue(id, { withBookings: true, withOwner: true }, auth);
        const data = res?.data?.data ?? res?.data ?? null;
        if (on) {
          // normalize minimal fields to prevent undefined reads
          const normalized = {
            id: data?.id ?? id,
            name: data?.name ?? "Venue",
            description: data?.description ?? "",
            rating: Number(data?.rating ?? 0),
            location: data?.location ?? {},
            media: Array.isArray(data?.media) ? data.media : [],
            price: Number(data?.price ?? 0),
            maxGuests: Number(data?.maxGuests ?? 1),
            bookings: Array.isArray(data?.bookings) ? data.bookings : [],
            owner: data?.owner ?? null,
          };
          setVenue(normalized);
          setStatus("idle");
          document.title = `Holidaze | ${normalized.name || "Venue"}`;
        }
      } catch (err) {
        console.error("❌ details fetch failed", err);
        if (on) {
          setStatus("error");
          document.title = "Holidaze | Error";
        }
      }
    })();
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, apiKey]);

  // If we just registered/logged in and there's a pending booking for THIS venue, auto-book it
  useEffect(() => {
    if (!isAuthed || authLoading) return;
    const pending = get(PENDING_KEY);
    if (!pending || pending?.venueId !== id) return;

    (async () => {
      try {
        setAutoBooking(true);
        setBookState({ submitting: true, error: "", success: "" });

        const { venueId, dateFrom, dateTo, guests: pGuests } = pending;

        // safety: preflight availability (with auth)
        const { ok, conflict } = await checkAvailability({ venueId, dateFrom, dateTo, auth });
        if (!ok) {
          setBookState({
            submitting: false,
            error: `Those dates are already booked (${fmt(conflict?.dateFrom)} → ${fmt(conflict?.dateTo)}).`,
            success: "",
          });
          remove(PENDING_KEY);
          setAutoBooking(false);
          return;
        }

        const res = await createBooking({ venueId, dateFrom, dateTo, guests: pGuests }, auth);
        console.log("[booking:auto] created", res?.data);
        setBookState({ submitting: false, error: "", success: "Booking confirmed!" });

        pushFlash(
          `Booking confirmed: ${fmt(dateFrom)} → ${fmt(dateTo)} · ${pGuests} guest${pGuests === 1 ? "" : "s"} at ${
            venue?.name || "venue"
          }.`,
          "success",
        );
        navigate("/profile?tab=bookings", { replace: true });
      } catch (err) {
        console.error("[booking:auto] failed", err);
        const apiMsg =
          err?.response?.data?.errors?.[0]?.message || err?.message || "Booking failed";
        setBookState({ submitting: false, error: apiMsg, success: "" });
      } finally {
        remove(PENDING_KEY);
        setAutoBooking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, authLoading, id]);

  // Derivations with safe fallbacks
  const image =
    venue?.media?.[0]?.url ||
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
  const rating = Number.isFinite(Number(venue?.rating)) ? Number(venue?.rating) : 0;
  const { city = "", country = "" } = venue?.location || {};
  const maxGuests = Number.isFinite(Number(venue?.maxGuests)) ? Number(venue?.maxGuests) : 1;
  const price = Number.isFinite(Number(venue?.price)) ? Number(venue?.price) : 0;

  const nights = countNights(range.from, range.to);
  const total = nights > 0 && Number.isFinite(price) ? nights * price : 0;

  const hasDates = Boolean(range?.from && range?.to);
  const datesLabel = hasDates ? `${fmtShort(range.from)} → ${fmtShort(range.to)}` : "Dates";

  const disabledRanges = useMemo(
    () => buildDisabledRanges(Array.isArray(venue?.bookings) ? venue.bookings : []),
    [venue?.bookings],
  );

  function validate() {
    if (!range?.from || !range?.to) return "Please select both start and end dates.";
    const g = clampInt(guests, 1, maxGuests || undefined);
    if (g < 1) return "Guests must be at least 1.";
    if (maxGuests && g > maxGuests) return `Max guests for this venue is ${maxGuests}.`;
    return "";
  }

  async function submitBooking({ venueId, dateFrom, dateTo, guests }) {
    // Require headers before any API call
    if (!auth?.token || !auth?.apiKey) {
      setBookState({ submitting: false, error: "", success: "" });
      setShowRegisterPrompt(true);
      return false;
    }

    const { ok, conflict } = await checkAvailability({ venueId, dateFrom, dateTo, auth });
    if (!ok) {
      setBookState({
        submitting: false,
        error: `Those dates are already booked (${fmt(conflict?.dateFrom)} → ${fmt(conflict?.dateTo)}).`,
        success: "",
      });
      return false;
    }

    const res = await createBooking({ venueId, dateFrom, dateTo, guests }, auth);
    console.log("[booking] created", res?.data);
    setBookState({ submitting: false, error: "", success: "Booking confirmed!" });
    return true;
  }

  async function onBook(e) {
    e.preventDefault();
    setBookState({ submitting: true, error: "", success: "" });

    const msg = validate();
    if (msg) {
      setBookState({ submitting: false, error: msg, success: "" });
      return;
    }

    const payload = {
      venueId: id,
      dateFrom: toIsoZMidnight(range.from),
      dateTo: toIsoZMidnight(range.to),
      guests: clampInt(guests, 1, maxGuests || undefined),
    };

    // If not logged in → save pending + prompt register, DO NOT POST
    if (!isAuthed || !auth?.token || !auth?.apiKey) {
      setBookState({ submitting: false, error: "", success: "" });
      save(PENDING_KEY, payload); // store only booking body
      setShowRegisterPrompt(true);
      return;
    }

    // Logged in → book now
    try {
      const ok = await submitBooking(payload);
      if (ok) {
        pushFlash(
          `Booking confirmed: ${fmt(payload.dateFrom)} → ${fmt(payload.dateTo)} · ${payload.guests} guest${
            payload.guests === 1 ? "" : "s"
          } at ${venue?.name || "venue"}.`,
          "success",
        );
        setTimeout(() => navigate("/profile?tab=bookings"), 200);
      }
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
          ★ {Number.isFinite(rating) ? rating.toFixed(1) : "0.0"} • {city}
          {city && country ? ", " : ""} {country}
        </p>
        {venue?.owner?.name && (
          <p className="text-sm text-gray-600">
            Hosted by{" "}
            <Link to={`/users/${venue.owner.name}`} className="underline text-blue-600">
              {venue.owner.name}
            </Link>
          </p>
        )}
      </header>

      <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[16/9]">
        <img
          src={image}
          alt={venue?.name || "Venue"}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
          }}
        />
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        {/* Left (compact description) */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">About this place</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {venue?.description || "No description yet."}
          </p>
        </div>

        {/* Booking panel — md:col-span-2 with SearchBar-like calendar popover */}
        <aside className="md:col-span-2 p-4 border rounded-2xl bg-white space-y-4" ref={calWrapRef}>
          {Number.isFinite(price) && (
            <p className="text-2xl">
              <span className="font-bold">${price}</span>{" "}
              <span className="text-gray-600 text-base">/ night</span>
            </p>
          )}

          <form onSubmit={onBook} className="space-y-4" noValidate>
            {/* Date selector (popover) */}
            <div className="space-y-2">
              <span className="block text-sm font-medium">Choose dates</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-expanded={calendarOpen}
                  aria-controls="vd-calendar"
                  onClick={() => setCalendarOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCalendarOpen((v) => !v);
                    }
                  }}
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.03]
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                             focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {datesLabel}
                </button>

                {hasDates && (
                  <button
                    type="button"
                    onClick={() => setRange({ from: null, to: null })}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.03]
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                               focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {calendarOpen && (
                <div
                  id="vd-calendar"
                  className="relative z-20 mt-2 w-full rounded-xl border border-black/10 bg-surface p-3 md:p-3 pl-2 shadow-md"
                >
                  <BookingCalendar
                    bookings={disabledRanges}
                    selected={range}
                    onSelect={(sel) => {
                      // Defensive: ensure shape {from,to}
                      setRange({
                        from: sel?.from ?? null,
                        to: sel?.to ?? null,
                      });
                    }}
                    minDate={new Date()}
                    numberOfMonths={2}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-black/10 px-3 py-2 hover:bg-black/[.03]
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                                 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      onClick={() => setCalendarOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Guests */}
            <label className="text-sm block">
              <span className="block mb-1">Guests {maxGuests ? `(max ${maxGuests})` : ""}</span>
              <input
                type="number"
                min={1}
                max={maxGuests || undefined}
                value={guests}
                onChange={(e) => setGuests(clampInt(e.target.value, 1, maxGuests || undefined))}
                className="w-full rounded border px-3 py-2
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                           focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                required
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </label>

            {/* Price Summary */}
            <div className="rounded-xl bg-black/[.03] p-3 text-sm">
              <div className="flex justify-between">
                <span>Nights</span>
                <span>{nights}</span>
              </div>
              <div className="flex justify-between">
                <span>Price / night</span>
                <span>{Number.isFinite(price) ? `$${price}` : "—"}</span>
              </div>
              <div className="mt-1 border-t border-black/10 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{nights > 0 && Number.isFinite(price) ? `$${total}` : "—"}</span>
              </div>
            </div>

            {/* If logged in: show what we will send */}
            {isAuthed && (
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Booking summary to submit:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Venue: {venue?.name || id}</li>
                  <li>From: {range?.from ? fmt(toIsoZMidnight(range.from)) : "—"}</li>
                  <li>To: {range?.to ? fmt(toIsoZMidnight(range.to)) : "—"}</li>
                  <li>Guests: {guests}</li>
                  <li>Total: {nights > 0 && Number.isFinite(price) ? `$${total}` : "—"}</li>
                </ul>
              </div>
            )}

            {/* Messages */}
            {bookState.error && <p className="text-sm text-red-600">{bookState.error}</p>}
            {bookState.success && <p className="text-sm text-green-700">{bookState.success}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={bookState.submitting || autoBooking}
              aria-label={bookState.submitting ? "Submitting booking" : "Book this venue"}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold disabled:opacity-60
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {bookState.submitting || autoBooking ? "Booking…" : "Book now"}
            </button>

            <p className="text-[11px] text-gray-500">
              You’ll be redirected to your profile after booking.
            </p>
          </form>
        </aside>
      </section>

      {/* Register to Book — popup */}
      {showRegisterPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40"
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
            onClick={() => setShowRegisterPrompt(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ")
                setShowRegisterPrompt(false);
            }}
          />
          <div className="relative z-[71] w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Create an account to finish booking</h3>
            <p className="text-sm text-gray-700 mb-4">
              We’ll save your selection and place your booking automatically right after you
              register.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowRegisterPrompt(false)}
              >
                Not now
              </button>
              <button
                type="button"
                className="rounded-lg bg-brand-700 text-white px-4 py-2 hover:bg-brand-800"
                onClick={() => {
                  setShowRegisterPrompt(false);
                  const next = `/venues/${id}`;
                  navigate(`/register?next=${encodeURIComponent(next)}`);
                }}
              >
                Register & Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
