// src/pages/ProfilePage.jsx
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile } from "../api/profiles";
import { updateBooking, deleteBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext";

// ⭐ Robust asset URL (dev & prod safe)
const stars = new URL("../assets/images/Stars_big.png", import.meta.url).href;

/* ------------------------------- Local helpers ------------------------------ */
function safeDate(dateLike) {
  const t = Date.parse(dateLike);
  return Number.isFinite(t) ? new Date(t) : null;
}
function toInputDate(value) {
  const d = safeDate(value);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmtRange(from, to) {
  const f = safeDate(from);
  const t = safeDate(to);
  const fStr = f ? f.toLocaleDateString() : "—";
  const tStr = t ? t.toLocaleDateString() : "—";
  return `${fStr} → ${tStr}`;
}
function safeArr(a) {
  return Array.isArray(a) ? a : [];
}

/* --------------------------------- Page --------------------------------- */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthed, profile: authProfile } = useAuth();

  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | idle | error
  const [error, setError] = useState("");

  // Edit/Delete UI state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ dateFrom: "", dateTo: "", guests: 1 });
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");

  // restore previous title on unmount
  useEffect(() => {
    const prevTitle = document.title;
    return () => {
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    async function fetchSelf() {
      try {
        setStatus("loading");
        setError("");
        document.title = "Holidaze | Profile";

        // If not authed or no name yet, show guard
        if (!isAuthed || !authProfile?.name) {
          setStatus("idle");
          setUser(null);
          return;
        }

        const res = await getProfile(authProfile.name, {
          withBookings: true,
          withVenues: true,
        });
        const data = res?.data?.data ?? res?.data ?? res ?? null;
        const normalized = {
          name: data?.name ?? authProfile.name ?? "",
          email: data?.email ?? "",
          avatar: data?.avatar ?? null,
          venueManager: Boolean(data?.venueManager),
          venues: safeArr(data?.venues),
          bookings: safeArr(data?.bookings),
        };
        setUser(normalized);
        setStatus("idle");
        document.title = `Holidaze | ${normalized.name || "Profile"}`;
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Could not load your profile.");
        setStatus("error");
        document.title = "Holidaze | Error";
      }
    }
    fetchSelf();
  }, [isAuthed, authProfile?.name]);

  // Sort bookings once; split deterministically
  const sortedBookings = useMemo(() => {
    const rows = safeArr(user?.bookings).slice();
    rows.sort((a, b) => {
      const at = Date.parse(a?.dateFrom) || 0;
      const bt = Date.parse(b?.dateFrom) || 0;
      return bt - at; // newest first
    });
    return rows;
  }, [user?.bookings]);

  const now = new Date();
  const upcoming = sortedBookings.filter((b) => {
    const to = safeDate(b?.dateTo);
    return to ? to >= now : false;
  });
  const past = sortedBookings.filter((b) => {
    const to = safeDate(b?.dateTo);
    return to ? to < now : false;
  });

  /* ------------------------------ Edit actions ----------------------------- */
  function openEdit(b) {
    setNotice("");
    setEditingId(b?.id || null);
    setEditForm({
      dateFrom: toInputDate(b?.dateFrom),
      dateTo: toInputDate(b?.dateTo),
      guests: Number(b?.guests) || 1,
    });
  }
  function closeEdit() {
    setEditingId(null);
    setSavingId(null);
    setEditForm({ dateFrom: "", dateTo: "", guests: 1 });
  }
  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: name === "guests" ? Number(value) : value }));
  }
  function validateEdit({ dateFrom, dateTo, guests }) {
    // Why: prevent server roundtrip on obvious mistakes
    if (!dateFrom || !dateTo) return "Please select both dates.";
    if (new Date(dateFrom) >= new Date(dateTo)) return "End date must be after start date.";
    if (!Number.isFinite(guests) || guests < 1) return "Guests must be at least 1.";
    return "";
  }
  async function submitEdit(e) {
    e?.preventDefault?.();
    if (!editingId) return;

    const msg = validateEdit(editForm);
    if (msg) {
      setNotice(msg);
      return;
    }

    try {
      setSavingId(editingId);
      const updated = await updateBooking(editingId, {
        dateFrom: editForm.dateFrom,
        dateTo: editForm.dateTo,
        guests: editForm.guests,
      });

      // Merge into local state (preserve venue/customer ref)
      setUser((u) => {
        const next = { ...(u || {}), bookings: safeArr(u?.bookings).slice() };
        const idx = next.bookings.findIndex((x) => x.id === editingId);
        if (idx !== -1) {
          next.bookings[idx] = { ...next.bookings[idx], ...updated };
        }
        return next;
      });

      setNotice("Booking updated.");
      closeEdit();
    } catch (err) {
      setNotice(err?.message || "Failed to update booking");
    } finally {
      setSavingId(null);
    }
  }

  /* ----------------------------- Delete actions ---------------------------- */
  async function onDelete(b) {
    if (!b?.id) return;
    // Why: warn user about irreversible action
    const ok = window.confirm("Cancel this booking? This cannot be undone.");
    if (!ok) return;

    try {
      setDeletingId(b.id);
      await deleteBooking(b.id);

      // Remove from state
      setUser((u) => ({
        ...(u || {}),
        bookings: safeArr(u?.bookings).filter((x) => x.id !== b.id),
      }));
      setNotice("Booking cancelled.");
    } catch (err) {
      setNotice(err?.message || "Failed to cancel booking");
    } finally {
      setDeletingId(null);
    }
  }

  /* ------------------------------ Render guards ---------------------------- */
  if (!isAuthed) {
    return (
      <div
        className="relative min-h-[100dvh] bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${stars})` }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />
        <div className="relative p-6 md:p-10">
          <div className="max-w-xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-6 border">
            <h1 className="text-2xl font-bold mb-2">You’re not signed in</h1>
            <p className="text-gray-600 mb-4">Please log in to view your profile and bookings.</p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-md bg-gray-900 text-white px-4 py-2"
                onClick={() => navigate("/login?next=/profile")}
              >
                Log in
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2"
                onClick={() => navigate("/register?next=/profile")}
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div
        className="relative min-h-[100dvh] bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${stars})` }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />
        <p className="relative p-6 md:p-10">Loading your profile…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="relative min-h-[100dvh] bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${stars})` }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />
        <p className="relative p-6 md:p-10 text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="relative min-h-[100dvh] bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${stars})` }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />
        <p className="relative p-6 md:p-10">No profile data.</p>
      </div>
    );
  }

  /* -------------------------------- Template ------------------------------- */
  return (
    // ⭐ Background applied at the page root
    <div
      className="relative min-h-[100dvh] bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${stars})` }}
    >
      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />

      <div className="relative p-6 md:p-10 space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-4">
            {user.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={`${user.avatar.alt || user.name || "User"} avatar`}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl"
                aria-hidden="true"
                title="No avatar"
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{user.name || "User"}</h1>
              {user.email && <p className="text-gray-600">{user.email}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link to={`/users/${user.name}`} className="text-blue-600 underline text-sm">
                  View public profile
                </Link>
                <Link
                  to="/settings"
                  className="text-sm rounded-md border border-gray-300 px-3 py-1.5 bg-white/80 backdrop-blur-sm"
                >
                  Edit profile
                </Link>
                {user.venueManager && (
                  <Link
                    to="/venues/create"
                    className="text-sm rounded-md px-3 py-1.5 bg-[color:var(--color-accent-300)] hover:bg-[color:var(--color-brand-700)] text-[color:var(--color-text)]"
                  >
                    Create venue
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {notice && (
          <div className="rounded-md bg-green-50 text-green-700 border border-green-200 px-4 py-2">
            {notice}
          </div>
        )}

        {/* Manager Venues */}
        {user.venueManager && (
          <section>
            <h2 className="text-xl font-semibold mb-2">My Venues</h2>
            {user.venues.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {user.venues.map((v) => (
                  <div key={v?.id || v?._id || v?.name} className="border rounded-xl p-4 bg-white/80 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold">{v?.name || "Untitled venue"}</h3>
                    {v?.description && <p className="text-sm text-gray-600">{v.description}</p>}
                    {Number.isFinite(Number(v?.maxGuests)) && (
                      <p className="text-sm">Max Guests: {v.maxGuests}</p>
                    )}
                    <div className="mt-1 flex gap-3">
                      {v?.id && (
                        <Link to={`/venues/${v.id}`} className="text-blue-600 underline text-sm inline-block">
                          View venue
                        </Link>
                      )}
                      {v?.id && (
                        <Link to={`/venues/${v.id}/edit`} className="text-sm underline text-gray-700 inline-block">
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">You have no venues yet.</p>
            )}
          </section>
        )}

        {/* Upcoming Bookings */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Upcoming Bookings</h2>
          {upcoming.length > 0 ? (
            <ul className="space-y-2">
              {upcoming.map((b) => {
                const isEditing = editingId === b?.id;
                return (
                  <li
                    key={b?.id || `${b?.venue?.id || "v"}-${b?.dateFrom || Math.random()}`}
                    className="border rounded p-3 bg-white/80 backdrop-blur-sm"
                  >
                    {!isEditing ? (
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm">
                          <strong>{b?.venue?.name || "Unknown venue"}</strong>
                          <br />
                          {fmtRange(b?.dateFrom, b?.dateTo)}
                          <br />
                          {Number.isFinite(Number(b?.guests)) && <>Guests: {b.guests}</>}
                          <br />
                          {b?.venue?.id && (
                            <Link to={`/venues/${b.venue.id}`} className="text-blue-600 underline text-sm">
                              View venue
                            </Link>
                          )}
                        </p>
                        <div className="flex gap-2">
                          <button
                            className="text-sm rounded-md border px-3 py-1.5 disabled:opacity-50"
                            onClick={() => openEdit(b)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-sm rounded-md border px-3 py-1.5 bg-red-600 text-white disabled:opacity-50"
                            disabled={deletingId === b?.id}
                            onClick={() => onDelete(b)}
                          >
                            {deletingId === b?.id ? "Cancelling…" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={submitEdit} className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">From</label>
                          <input
                            type="date"
                            name="dateFrom"
                            value={editForm.dateFrom}
                            onChange={onEditChange}
                            required
                            className="w-full rounded-md border px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">To</label>
                          <input
                            type="date"
                            name="dateTo"
                            value={editForm.dateTo}
                            onChange={onEditChange}
                            required
                            className="w-full rounded-md border px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Guests</label>
                          <input
                            type="number"
                            name="guests"
                            min={1}
                            value={editForm.guests}
                            onChange={onEditChange}
                            className="w-28 rounded-md border px-3 py-2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={savingId === b?.id}
                            className="rounded-md border px-3 py-2 bg-gray-900 text-white disabled:opacity-50"
                          >
                            {savingId === b?.id ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="rounded-md border px-3 py-2"
                            onClick={closeEdit}
                          >
                            Cancel
                          </button>
                        </div>
                        {notice && (
                          <div className="md:col-span-4 text-sm text-red-600">{notice}</div>
                        )}
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-600">No upcoming bookings.</p>
          )}
        </section>

        {/* Past Bookings */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Past Bookings</h2>
          {past.length > 0 ? (
            <ul className="space-y-2">
              {past.map((b) => (
                <li
                  key={b?.id || `${b?.venue?.id || "v"}-${b?.dateTo || Math.random()}`}
                  className="border rounded p-3 bg-white/80 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm">
                      <strong>{b?.venue?.name || "Unknown venue"}</strong>
                      <br />
                      {fmtRange(b?.dateFrom, b?.dateTo)}
                      <br />
                      {Number.isFinite(Number(b?.guests)) && <>Guests: {b.guests}</>}
                      <br />
                      {b?.venue?.id && (
                        <Link to={`/venues/${b.venue.id}`} className="text-blue-600 underline text-sm">
                          View venue
                        </Link>
                      )}
                    </p>
                    {/* Past bookings are locked for edits/cancel */}
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No past bookings.</p>
          )}
        </section>
      </div>
    </div>
  );
}
