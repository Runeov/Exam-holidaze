// src/pages/ProfilePage.jsx
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfileBookings, deleteBooking, updateBooking } from "../api/bookings";
import BookingCalendar from "../components/BookingCalendar";
import { getAuthHeaders } from "../api/auth";

const API = "https://v2.api.noroff.dev";

const fmt = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function nightsBetween(fromIso, toIso) {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/** normalize to UTC midnight (safe for server comparisons) */
function toUtcMidnight(dateLike) {
  const d = new Date(dateLike);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** we treat ranges as [start, end) */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const A1 = toUtcMidnight(aStart);
  const A2 = toUtcMidnight(aEnd);
  const B1 = toUtcMidnight(bStart);
  const B2 = toUtcMidnight(bEnd);
  return A1 < B2 && B1 < A2;
}

function hasConflictExcluding(bookings = [], dateFrom, dateTo, excludeId) {
  return bookings.some(
    (b) => b.id !== excludeId && rangesOverlap(dateFrom, dateTo, b.dateFrom, b.dateTo),
  );
}

/** convert Date (local) → ISO at UTC midnight */
function toIsoZMidnight(date) {
  const d = new Date(date);
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString();
}

export default function ProfilePage() {
  const { isAuthed, loading: authLoading, profile } = useAuth();

  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [busyId, setBusyId] = useState(null);

  // EDIT modal state
  const [edit, setEdit] = useState({
    open: false,
    booking: null,
    range: { from: null, to: null },
    guests: 1,
    venueBookings: [],
    loading: false,
    saving: false,
    error: "",
  });

  // Load "my bookings"
  useEffect(() => {
    async function run() {
      if (!isAuthed || !profile?.name) return;
      try {
        setState((s) => ({ ...s, loading: true, error: "" }));
        const rows = await getProfileBookings(profile.name, { includeVenue: true, limit: 100 });
        setState({ loading: false, error: "", rows: Array.isArray(rows) ? rows : [] });
      } catch (err) {
        setState({ loading: false, error: err?.message || "Failed to load bookings", rows: [] });
      }
    }
    run();
  }, [isAuthed, profile?.name]);

  const todayMid = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcoming = useMemo(
    () =>
      state.rows
        .filter((b) => new Date(b.dateTo) >= todayMid)
        .sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom)),
    [state.rows, todayMid],
  );

  const past = useMemo(
    () =>
      state.rows
        .filter((b) => new Date(b.dateTo) < todayMid)
        .sort((a, b) => new Date(b.dateFrom) - new Date(a.dateFrom)),
    [state.rows, todayMid],
  );

  async function onCancel(bookingId) {
    if (!bookingId) return;
    const ok = confirm("Cancel this booking?");
    if (!ok) return;
    try {
      setBusyId(bookingId);
      await deleteBooking(bookingId);
      setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== bookingId) }));
    } catch (err) {
      alert(err?.message || "Failed to cancel booking");
    } finally {
      setBusyId(null);
    }
  }

  // --- EDIT FLOW ----------------------------------------------------

  function openEdit(b) {
    if (!b?.venue?.id) {
      alert("This booking has no linked venue id.");
      return;
    }
    setEdit({
      open: true,
      booking: b,
      range: { from: new Date(b.dateFrom), to: new Date(b.dateTo) },
      guests: b.guests || 1,
      venueBookings: [],
      loading: true,
      saving: false,
      error: "",
    });

    // load latest bookings for the venue so the calendar can disable them
    fetch(`${API}/holidaze/venues/${b.venue.id}?_bookings=true`, {
      headers: { ...getAuthHeaders() },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load venue (${res.status})`);
        const { data } = await res.json();
        setEdit((e) => ({
          ...e,
          loading: false,
          venueBookings: data?.bookings || [],
        }));
      })
      .catch((err) => {
        console.error("[edit] venue fetch failed", err);
        setEdit((e) => ({ ...e, loading: false, error: "Could not load venue bookings." }));
      });
  }

  function closeEdit() {
    setEdit({
      open: false,
      booking: null,
      range: { from: null, to: null },
      guests: 1,
      venueBookings: [],
      loading: false,
      saving: false,
      error: "",
    });
  }

  async function saveEdit() {
    if (!edit.booking) return;
    if (!edit.range?.from || !edit.range?.to) {
      setEdit((e) => ({ ...e, error: "Please select both start and end dates." }));
      return;
    }
    if (edit.guests < 1) {
      setEdit((e) => ({ ...e, error: "Guests must be at least 1." }));
      return;
    }

    const bookingId = edit.booking.id;
    const venueId = edit.booking.venue?.id;
    const dateFromIso = toIsoZMidnight(edit.range.from);
    const dateToIso = toIsoZMidnight(edit.range.to);

    try {
      setEdit((e) => ({ ...e, saving: true, error: "" }));

      // Fresh preflight: re-fetch venue bookings to avoid race conditions
      const pre = await fetch(`${API}/holidaze/venues/${venueId}?_bookings=true`, {
        headers: { ...getAuthHeaders() },
      });
      if (!pre.ok) throw new Error(`Preflight failed (${pre.status})`);
      const { data: v } = await pre.json();

      if (hasConflictExcluding(v?.bookings || [], dateFromIso, dateToIso, bookingId)) {
        setEdit((e) => ({
          ...e,
          saving: false,
          error: "Those dates overlap another booking for this venue.",
        }));
        return;
      }

      const updated = await updateBooking(bookingId, {
        dateFrom: dateFromIso,
        dateTo: dateToIso,
        guests: edit.guests,
      });

      // Merge updated fields into local state
      setState((s) => ({
        ...s,
        rows: s.rows.map((r) =>
          r.id === bookingId
            ? {
                ...r,
                dateFrom: updated.dateFrom ?? dateFromIso,
                dateTo: updated.dateTo ?? dateToIso,
                guests: updated.guests ?? edit.guests,
              }
            : r,
        ),
      }));

      closeEdit();
    } catch (err) {
      console.error("[edit] save failed", err);
      setEdit((e) => ({
        ...e,
        saving: false,
        error: err?.message || "Failed to update booking.",
      }));
    }
  }

  // -----------------------------------------------------------------

  if (authLoading) return <p className="p-6">Loading your profile…</p>;
  if (!isAuthed) {
    return (
      <div className="p-6">
        <p className="mb-2">You must be logged in to view your bookings.</p>
        <Link to="/login" className="inline-block px-4 py-2 rounded-lg bg-gray-900 text-white">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold">My Profile</h1>
        <p className="text-gray-600">
          Signed in as <span className="font-medium">{profile?.name}</span>
        </p>
      </header>

      {/* UPCOMING */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Upcoming bookings</h2>
        {state.loading ? (
          <p>Loading bookings…</p>
        ) : state.error ? (
          <p className="text-red-600">{state.error}</p>
        ) : upcoming.length === 0 ? (
          <p className="text-gray-600">You have no upcoming bookings.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b) => {
              const v = b.venue || {};
              const nights = nightsBetween(b.dateFrom, b.dateTo);
              return (
                <li
                  key={b.id}
                  className="border rounded-2xl p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {v.id ? (
                        <Link to={`/venues/${v.id}`} className="underline">
                          {v.name || "Venue"}
                        </Link>
                      ) : (
                        v.name || "Venue"
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {fmt(b.dateFrom)} → {fmt(b.dateTo)} • {nights} night{nights === 1 ? "" : "s"}{" "}
                      • {b.guests} guest{b.guests === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="px-3 py-2 rounded-lg border font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onCancel(b.id)}
                      disabled={busyId === b.id}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-60"
                    >
                      {busyId === b.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* PAST */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Past bookings</h2>
        {state.loading ? (
          <p>Loading…</p>
        ) : past.length === 0 ? (
          <p className="text-gray-600">No past bookings yet.</p>
        ) : (
          <ul className="space-y-3">
            {past.map((b) => {
              const v = b.venue || {};
              const nights = nightsBetween(b.dateFrom, b.dateTo);
              return (
                <li
                  key={b.id}
                  className="border rounded-2xl p-4 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{v.name || "Venue"}</h3>
                    <p className="text-sm text-gray-600">
                      {fmt(b.dateFrom)} → {fmt(b.dateTo)} • {nights} night{nights === 1 ? "" : "s"}{" "}
                      • {b.guests} guest{b.guests === 1 ? "" : "s"}
                    </p>
                  </div>
                  {v.id && (
                    <Link
                      to={`/venues/${v.id}`}
                      className="px-3 py-2 rounded-lg border font-medium"
                    >
                      Book again
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* EDIT MODAL */}
      {edit.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Edit booking</h3>
              <button onClick={closeEdit} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>

            {edit.loading ? (
              <p>Loading venue bookings…</p>
            ) : (
              <>
                <div className="space-y-2">
                  <span className="block text-sm font-medium">Choose new dates</span>
                  <BookingCalendar
                    bookings={edit.venueBookings}
                    selected={edit.range}
                    onSelect={(next) =>
                      setEdit((e) => ({
                        ...e,
                        range: next || { from: null, to: null },
                        error: "",
                      }))
                    }
                    minDate={new Date()}
                  />
                </div>

                <label className="text-sm block">
                  <span className="block mb-1">Guests</span>
                  <input
                    type="number"
                    min={1}
                    value={edit.guests}
                    onChange={(e) =>
                      setEdit((s) => ({ ...s, guests: Number(e.target.value), error: "" }))
                    }
                    className="w-full rounded border px-2 py-1"
                    required
                  />
                </label>

                {edit.error && <p className="text-sm text-red-600">{edit.error}</p>}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={closeEdit} className="px-3 py-2 rounded-lg border">
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={edit.saving}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-60"
                  >
                    {edit.saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
