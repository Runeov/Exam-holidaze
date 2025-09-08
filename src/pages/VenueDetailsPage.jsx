
import React, { useEffect, useRef, useState,useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBooking } from "../api/bookings";
import { getVenue } from "../api/venues";
import BookingCalendar from "../components/BookingCalendar";
import { useAuth } from "../context/AuthContext";
import { checkAvailability } from "../logic/checkAvailability";
import { buildDisabledRanges } from "../utils/availability";
import { pushFlash } from "../utils/flash";
import { get, remove, save } from "../utils/storage";
import { useStableId } from "../utils/uid";

// ---------- Helpers (pure) ----------
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

  const [venue, setVenue] = useState(null);
  const [status, setStatus] = useState("idle");

  // booking UI
  const [range, setRange] = useState({ from: null, to: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calWrapRef = useRef(null);
  const [guests, setGuests] = useState(1);
  const [bookState, setBookState] = useState({ submitting: false, error: "", success: "" });

  // register-then-book modal
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [autoBooking, setAutoBooking] = useState(false);

  // previous title restore
  useEffect(() => {
    const prev = document.title;
    return () => {
      document.title = prev;
    };
  }, []);

  // stable uid
  const uid = useStableId("venue");

  // Close calendar popover when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!calWrapRef.current) return;
      if (!calWrapRef.current.contains(e.target)) setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Fetch details (public)
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setStatus("loading");
        document.title = "Holidaze | Venue";
        const res = await getVenue(id, { withBookings: true, withOwner: true });
        const data = res?.data?.data ?? res?.data ?? null;
        if (on) {
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
        console.error("details fetch failed", err);
        if (on) {
          setStatus("error");
          document.title = "Holidaze | Error";
        }
      }
    })();
    return () => {
      on = false;
    };
  }, [id]);

  // If we just authed and a pending booking matches this venue, auto-book it
  useEffect(() => {
    if (!isAuthed || authLoading) return;
    const pending = get(PENDING_KEY);
    if (!pending || pending?.venueId !== id) return;

    (async () => {
      try {
        setAutoBooking(true);
        setBookState({ submitting: true, error: "", success: "" });

        const { venueId, dateFrom, dateTo, guests: pGuests } = pending;
        const { ok, conflict } = await checkAvailability({
          venueId,
          dateFrom,
          dateTo,
          auth: { token, apiKey },
        });
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

        const res = await createBooking(
          { venueId, dateFrom, dateTo, guests: pGuests },
          { token, apiKey }
        );
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
        const apiMsg = err?.response?.data?.errors?.[0]?.message || err?.message || "Booking failed";
        setBookState({ submitting: false, error: apiMsg, success: "" });
      } finally {
        remove(PENDING_KEY);
        setAutoBooking(false);
      }
    })();
  }, [isAuthed, authLoading, id, token, apiKey, navigate, venue?.name]);

  // Derivations
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
  const datesLabel = hasDates ? `${fmtShort(range.from)} → ${fmtShort(range.to)}` : "Select dates";

  const disabledRanges = useMemo(
    () => buildDisabledRanges(Array.isArray(venue?.bookings) ? venue.bookings : []),
    [venue?.bookings]
  );

  function validate() {
    if (!range?.from || !range?.to) return "Please select both start and end dates.";
    const g = clampInt(guests, 1, maxGuests || undefined);
    if (g < 1) return "Guests must be at least 1.";
    if (maxGuests && g > maxGuests) return `Max guests for this venue is ${maxGuests}.`;
    return "";
  }

  async function submitBooking({ venueId, dateFrom, dateTo, guests }) {
    if (!token || !apiKey) {
      setBookState({ submitting: false, error: "", success: "" });
      setShowRegisterPrompt(true);
      return false;
    }

    const { ok, conflict } = await checkAvailability({
      venueId,
      dateFrom,
      dateTo,
      auth: { token, apiKey },
    });
    if (!ok) {
      setBookState({
        submitting: false,
        error: `Those dates are already booked (${fmt(conflict?.dateFrom)} → ${fmt(conflict?.dateTo)}).`,
        success: "",
      });
      return false;
    }

    const res = await createBooking({ venueId, dateFrom, dateTo, guests }, { token, apiKey });
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

    if (!isAuthed || !token || !apiKey) {
      setBookState({ submitting: false, error: "", success: "" });
      save(PENDING_KEY, payload);
      setShowRegisterPrompt(true);
      return;
    }

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

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-6 w-40 animate-pulse rounded bg-black/10" />
        <div className="mt-4 h-8 w-72 animate-pulse rounded bg-black/10" />
        <div className="mt-6 aspect-[16/9] w-full animate-pulse rounded-2xl bg-black/10" />
      </div>
    );
  }
  if (status === "error") return <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">Couldn’t load this venue.</p>;
  if (!venue) return <p className="mx-auto max-w-3xl px-4 py-8">No venue found.</p>;

  return (
  <div className="min-h-screen bg-gradient-to-b from-[--color-holidaze-navbar-500] to-[--color-holidaze-background-500] px-4 py-10">
    <div className="mx-auto max-w-6xl space-y-10 text-[--color-text]">
      {/* Header */}
      <header className="space-y-3">
        <Link
          to="/venues"
          className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text]"
        >
          <span aria-hidden>←</span>
          <span>Back to all venues</span>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-white">
          {venue?.name}
        </h1>

        <p className="text-sm text-white/80 flex flex-wrap gap-1">
          <span className="sr-only">Rating</span>
          <span aria-hidden="true">★</span>
          <span className="ml-1">{rating.toFixed(1)}</span>
          <span className="mx-1" aria-hidden="true">•</span>
          <span>{city}{city && country ? ", " : ""}{country}</span>
        </p>

        {venue?.owner?.name && (
          <p className="text-sm text-white/80">
            Hosted by{" "}
            <Link
              to={`/users/${venue.owner.name}`}
              className="text-[--color-star] underline hover:text-[--color-glow-blue]"
            >
              {venue.owner.name}
            </Link>
          </p>
        )}
      </header>

      {/* Hero Image */}
      <div className="overflow-hidden rounded-2xl border border-[--color-ring] shadow-md">
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

      {/* Main Content */}
      <section className="grid gap-10 md:grid-cols-3">
        {/* Venue Description */}
        <div className="space-y-4 md:col-span-1">
          <div className="rounded-2xl bg-white/95 p-6 shadow-md backdrop-blur">
            <h2 className="text-xl font-semibold text-[--color-brand-700]">
              About this place
            </h2>
            <p className="mt-2 whitespace-pre-line text-[--color-text-muted]">
              {venue?.description || "No description yet."}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-[--color-text-muted]">
              <div className="rounded-lg bg-[--color-brand-50] p-3">
                <dt className="font-medium text-[--color-text]">Max guests</dt>
                <dd>{maxGuests}</dd>
              </div>
              <div className="rounded-lg bg-[--color-brand-50] p-3">
                <dt className="font-medium text-[--color-text]">Price / night</dt>
                <dd>{Number.isFinite(price) ? `$${price}` : "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Booking Panel */}
        <aside ref={calWrapRef} className="md:col-span-2">
          <div className="rounded-2xl border border-[--color-ring] bg-white/95 p-6 shadow-md backdrop-blur space-y-6">
            <p className="text-2xl font-bold text-[--color-brand-700]">
              ${price}{" "}
              <span className="text-base font-normal text-[--color-text-muted]">/ night</span>
            </p>

            <form onSubmit={onBook} className="space-y-6" noValidate>
              {/* Dates */}
              <div className="space-y-2">
                <label htmlFor={`${uid}-calendar-button`} className="block text-sm font-medium">
                  Dates
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    id={`${uid}-calendar-button`}
                    aria-expanded={calendarOpen}
                    aria-controls={`${uid}-calendar`}
                    onClick={() => setCalendarOpen((v) => !v)}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium
                               hover:bg-black/[.03] transition
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    {datesLabel}
                  </button>

                  {hasDates && (
                    <button
                      type="button"
                      onClick={() => setRange({ from: null, to: null })}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium
                                 hover:bg-black/[.03] transition
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {calendarOpen && (
                  <div
                    id={`${uid}-calendar`}
                    className="mt-2 w-full rounded-2xl border border-[--color-ring] bg-white p-4 shadow-md"
                  >
                    <BookingCalendar
                      bookings={disabledRanges}
                      selected={range}
                      onSelect={(sel) => setRange({ from: sel?.from ?? null, to: sel?.to ?? null })}
                      minDate={new Date()}
                      numberOfMonths={2}
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(false)}
                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium
                                   hover:bg-black/[.03] transition
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Guests */}
              <div>
                <label htmlFor={`${uid}-guests`} className="block text-sm font-medium mb-1">
                  Guests {maxGuests ? `(max ${maxGuests})` : ""}
                </label>
                <input
                  id={`${uid}-guests`}
                  type="number"
                  min={1}
                  max={maxGuests || undefined}
                  value={guests}
                  onChange={(e) => setGuests(clampInt(e.target.value, 1, maxGuests))}
                  className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium
                             text-[--color-text] shadow-sm transition
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                />
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl bg-[--color-brand-50] p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Nights</span>
                  <span>{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price / night</span>
                  <span>{Number.isFinite(price) ? `$${price}` : "—"}</span>
                </div>
                <div className="border-t border-[--color-ring] pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{nights > 0 ? `$${total}` : "—"}</span>
                </div>
              </div>

              {/* Auth Preview */}
              {isAuthed && (
                <div className="text-xs text-[--color-text-muted]">
                  <p className="font-medium mb-1">Booking summary:</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li>Venue: {venue?.name || id}</li>
                    <li>From: {range?.from ? fmt(toIsoZMidnight(range.from)) : "—"}</li>
                    <li>To: {range?.to ? fmt(toIsoZMidnight(range.to)) : "—"}</li>
                    <li>Guests: {guests}</li>
                    <li>Total: {nights > 0 ? `$${total}` : "—"}</li>
                  </ul>
                </div>
              )}

              {/* Feedback */}
              {bookState.error && (
                <p className="text-sm text-[--color-error-500]">
                  {bookState.error}
                </p>
              )}
              {bookState.success && (
                <p className="text-sm text-green-600">
                  {bookState.success}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={bookState.submitting || autoBooking}
                className="rounded-full border border-transparent bg-[--color-brand-600] px-4 py-2 text-sm font-medium text-white
                           hover:bg-[--color-brand-700] transition
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[--color-brand-500] focus-visible:ring-offset-2 focus-visible:ring-offset-white
                           disabled:opacity-60 disabled:cursor-not-allowed w-full"
              >
                {bookState.submitting || autoBooking ? "Booking…" : "Book now"}
              </button>

              <p className="text-[11px] text-[--color-text-muted]">
                You’ll be redirected to your profile after booking.
              </p>
            </form>
          </div>
        </aside>
      </section>
    </div>
  </div>
);
}