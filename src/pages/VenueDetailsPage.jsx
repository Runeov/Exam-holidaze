import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBooking } from "../api/bookings";
import { getVenue } from "../api/venues";
import CalendarDropdown from "../components/CalendarDropdown";
import { useAuth } from "../context/AuthContext";
import { checkAvailability } from "../logic/checkAvailability";
import { pushFlash } from "../utils/flash";
import { get, remove, save } from "../utils/storage";
import { useStableId } from "../utils/uid";

// ---------- Helpers ----------
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

  const [range, setRange] = useState({ from: null, to: null });
  const [guests, setGuests] = useState(1);
  const [bookState, setBookState] = useState({ submitting: false, error: "", success: "" });

  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [autoBooking, setAutoBooking] = useState(false);

  const uid = useStableId("venue");

  // Restore previous title on unmount
  useEffect(() => {
    const prev = document.title;
    return () => {
      document.title = prev;
    };
  }, []);

  // Fetch details
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
  }, [id]);

  // Auto-book if pending booking exists
  useEffect(() => {
    if (!isAuthed || authLoading) return;
    const pending = get(PENDING_KEY);
    if (!pending || pending?.venueId !== id) return;

    (async () => {
      try {
        setAutoBooking(true);
        setBookState({ submitting: true, error: "", success: "" });

        const { venueId, dateFrom, dateTo, guests: pGuests } = pending;
        const { ok, conflict } = await checkAvailability({ venueId, dateFrom, dateTo, auth: { token, apiKey } });
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

        const res = await createBooking({ venueId, dateFrom, dateTo, guests: pGuests }, { token, apiKey });
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
    const { ok, conflict } = await checkAvailability({ venueId, dateFrom, dateTo, auth: { token, apiKey } });
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
      <div className="mx-auto max-w-6xl px-4 py-8" role="status" aria-live="polite">
        <div className="h-6 w-40 animate-pulse rounded bg-black/10" />
        <div className="mt-4 h-8 w-72 animate-pulse rounded bg-black/10" />
        <div className="mt-6 aspect-[16/9] w-full animate-pulse rounded-2xl bg-black/10" />
        <span className="sr-only">Loading venue details…</span>
      </div>
    );
  }
  if (status === "error")
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-red-700 bg-red-50 border border-red-200 rounded" role="alert">
        Couldn’t load this venue.
      </p>
    );
  if (!venue) return <p className="mx-auto max-w-3xl px-4 py-8">No venue found.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10" role="main" aria-label="Venue details page">
      {/* Accessible header card with brighter header strip */}
      <header className="space-y-3" aria-labelledby={`${uid}-venue-title`}>
        <section
          className="rounded-2xl border border-black/10 bg-white text-gray-900 shadow-sm overflow-hidden"
          aria-describedby={`${uid}-venue-meta`}
        >
          <div
            className="px-4 py-3 bg-[color:var(--color-brand-100)]/90 border-b border-black/10
                       text-[color:var(--color-brand-900)]"
          >
            <h1 id={`${uid}-venue-title`} className="text-xl md:text-2xl font-bold leading-tight">
              {venue?.name || "Venue"}
            </h1>
          </div>

          <div className="p-4 space-y-2">
            <p
              id={`${uid}-venue-meta`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-white/95
                         bg-black/60 backdrop-blur px-2 py-0.5 rounded-full shadow-sm
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[color:var(--color-brand-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <span className="sr-only">Rating</span>
              <span aria-hidden="true">★</span>
              <span className="ml-1">{Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}</span>
              <span className="mx-1" aria-hidden="true">
                •
              </span>
              <span>
                {city}
                {city && country ? ", " : ""}
                {country}
              </span>
            </p>

            {venue?.owner?.name && (
              <p className="text-sm text-gray-800">
                Hosted by{" "}
                <Link
                  to={`/users/${venue.owner.name}`}
                  className="underline text-[color:var(--color-brand-700)] hover:text-[color:var(--color-brand-800)]"
                  aria-label={`View profile for ${venue.owner.name}`}
                >
                  {venue.owner.name}
                </Link>
              </p>
            )}
          </div>
        </section>
      </header>

      <div className="mt-4 overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={image}
          alt={venue?.name ? `${venue.name} photo` : "Venue photo"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
          }}
        />
      </div>

      <section className="mt-6 grid gap-6 md:grid-cols-3 bg-[linear-gradient(rgba(255,255,255,0.25),rgba(255,255,255,0.25)),url('/images/Clouds_navbar2.png')]
    bg-no-repeat bg-cover bg-center" aria-label="Venue information and booking">
        <div className="space-y-4 md:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900">About this place</h2>
          <p className="whitespace-pre-line text-gray-800">{venue?.description || "No description yet."}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm text-gray-900">
            <div className="rounded-lg bg-gray-50 p-2 border border-black/10">
              <dt className="font-medium">Max guests</dt>
              <dd>{maxGuests}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 border border-black/10">
              <dt className="font-medium">Price / night</dt>
              <dd>{Number.isFinite(price) ? `$${price}` : "—"}</dd>
            </div>
          </dl>
        </div>

        <aside className="md:col-span-2" aria-label="Booking form">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            {Number.isFinite(price) && (
              <p className="text-2xl text-gray-900">
                <span className="font-bold">${price}</span>{" "}
                <span className="text-base text-gray-700">/ night</span>
              </p>
            )}

            <form
              onSubmit={onBook}
              className="mt-4 space-y-5"
              noValidate
              aria-busy={bookState.submitting || autoBooking ? "true" : "false"}
            >
              {/* Dates picker */}
              <div aria-label="Choose dates">
                <CalendarDropdown
                  selected={range}
                  onChange={setRange}
                  onApply={() => {}}
                  minDate={new Date()}
                  bookings={venue?.bookings ?? []}
                />
              </div>

              {/* Guests */}
              <label htmlFor={`${uid}-guests`} className="block text-sm text-gray-900">
                <span className="mb-1 block">
                  Guests {maxGuests ? `(max ${maxGuests})` : ""}
                </span>
                <input
                  id={`${uid}-guests`}
                  type="number"
                  min={1}
                  max={maxGuests || undefined}
                  value={guests}
                  onChange={(e) => setGuests(clampInt(e.target.value, 1, maxGuests || undefined))}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 shadow-sm
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-describedby={`${uid}-guests-help`}
                />
                <span id={`${uid}-guests-help`} className="mt-1 block text-xs text-gray-700">
                  Enter number of guests between 1{maxGuests ? ` and ${maxGuests}` : ""}.
                </span>
              </label>

              {/* Cost summary (live-updating for SR users) */}
              <div className="rounded-xl bg-gray-50 p-3 text-sm border border-black/10" aria-live="polite">
                <div className="flex justify-between text-gray-900">
                  <span>Nights</span>
                  <span>{nights}</span>
                </div>
                <div className="flex justify-between text-gray-900">
                  <span>Price / night</span>
                  <span>{Number.isFinite(price) ? `$${price}` : "—"}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-black/10 pt-2 font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{nights > 0 && Number.isFinite(price) ? `$${total}` : "—"}</span>
                </div>
              </div>

              {isAuthed && (
                <div className="text-xs text-gray-800">
                  <p className="mb-1 font-medium">Booking summary to submit:</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    <li>Venue: {venue?.name || id}</li>
                    <li>From: {range?.from ? fmt(toIsoZMidnight(range.from)) : "—"}</li>
                    <li>To: {range?.to ? fmt(toIsoZMidnight(range.to)) : "—"}</li>
                    <li>Guests: {guests}</li>
                    <li>Total: {nights > 0 && Number.isFinite(price) ? `$${total}` : "—"}</li>
                  </ul>
                </div>
              )}

              {bookState.error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2" role="alert">
                  {bookState.error}
                </p>
              )}
              {bookState.success && (
                <p className="text-sm text-grey-800 bg-green-50 border border-green-200 rounded px-3 py-2" role="status">
                  {bookState.success}
                </p>
              )}

              <button
                type="submit"
                disabled={bookState.submitting || autoBooking}
                aria-label={bookState.submitting ? "Submitting booking" : "Book this venue"}
                aria-describedby={`${uid}-postbook-note`}
                className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white shadow-sm transition
                           hover:bg-black focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white
                           disabled:opacity-60"
              >
                {bookState.submitting || autoBooking ? "Booking…" : "Book now"}
              </button>

              <p id={`${uid}-postbook-note`} className="text-[11px] text-gray-700">
                You’ll be redirected to your profile after booking.
              </p>
            </form>
          </div>
        </aside>
      </section>

      {showRegisterPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${uid}-register-title`}
          aria-describedby={`${uid}-register-desc`}
          className="fixed inset-0 z-[70] grid place-items-center p-4"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setShowRegisterPrompt(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setShowRegisterPrompt(false);
            }}
          />
          <div className="relative z-[71] w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-black/10">
            <h3 id={`${uid}-register-title`} className="mb-2 text-lg font-semibold text-gray-900">
              Create an account to finish booking
            </h3>
            <p id={`${uid}-register-desc`} className="mb-4 text-sm text-gray-800">
              We’ll save your selection and place your booking automatically right after you register.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-black/10 px-4 py-2 text-gray-900 hover:bg-black/[.05]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                onClick={() => setShowRegisterPrompt(false)}
              >
                Not now
              </button>
              <button
                type="button"
                className="rounded-lg bg-[color:var(--color-brand-700)] px-4 py-2 text-white hover:bg-[color:var(--color-brand-800)]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[color:var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                onClick={() => {
                  setShowRegisterPrompt(false);
                  const next = `/venues/${id}`;
                  navigate(`/register?next=${encodeURIComponent(next)}`);
                }}
              >
                Register &amp; Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
