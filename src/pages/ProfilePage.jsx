/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile } from "../api/profiles";
import { updateBooking, deleteBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import ProfileHeader from "../components/ProfileHeader";

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
// Media helpers for venue thumbnails
function firstMedia(v) {
  const arr = safeArr(v?.media);
  return arr.length ? arr[0] : null;
}
function mediaUrl(v) {
  const m = firstMedia(v);
  return m?.url || "";
}
function mediaAlt(v) {
  const m = firstMedia(v);
  return m?.alt || v?.name || "Venue image";
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
          banner: data?.banner ?? null,
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

  /* ------------------------------ Render guards (no stars bg) --------------- */
  if (!isAuthed) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border">
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
    );
  }

  if (status === "loading") {
    return <p className="px-4 sm:px-6 lg:px-8 py-6">Loading your profile…</p>;
  }

  if (status === "error") {
    return <p className="px-4 sm:px-6 lg:px-8 py-6 text-red-600">{error}</p>;
  }

  if (!user) {
    return <p className="px-4 sm:px-6 lg:px-8 py-6">No profile data.</p>;
  }

  /* --------------------------------- Render -------------------------------- */
  const headerRight = (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to="/settings"
        className="text-sm rounded-md border border-gray-300 px-3 py-1.5 bg-white"
      >
        Edit profile
      </Link>
      {user?.venueManager && (
        <Link
          to="/venues/create"
          className="text-sm rounded-md px-3 py-1.5
                     bg-[var(--color-accent-300)]
                     hover:bg-[var(--color-brand-700)]
                     text-[var(--color-text)]"
        >
          Create venue
        </Link>
      )}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Full profile header (banner + avatar + title + actions) */}
        <ProfileHeader
          variant="full"
          name={user?.name || authProfile?.name || "Profile"}
          subtitle={user?.email || authProfile?.email || ""}
          venueManager={Boolean(user?.venueManager ?? authProfile?.venueManager)}
          bannerUrl={user?.banner?.url || ""}
          avatarUrl={user?.avatar?.url || authProfile?.avatar?.url || ""}
          rightSlot={headerRight}
        />

        {/* Notice */}
        {notice && (
          <div className="rounded-md bg-green-50 text-green-700 border border-green-200 px-4 py-2">
            {notice}
          </div>
        )}

        {/* My Venues (rendered like bookings items; no per-card Edit, instead link to My Venues) */}
        {user?.venueManager && (
          <section id="my-venues">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">My Venues</h2>
              <Link to="/profile#my-venues" className="text-sm rounded-md border px-3 py-1.5">
  My Venues
</Link>
            </div>

            {user?.venues?.length > 0 ? (
              <ul className="space-y-2">
                {user.venues.map((v) => {
                  const vImg = mediaUrl(v);
                  const vAlt = mediaAlt(v);
                  return (
                    <li
                      key={v?.id || v?._id || v?.name}
                      className="border rounded p-3 bg-white"
                    >
                      <div className="flex items-start gap-3">
                        {/* Venue thumbnail */}
                        <div className="relative w-24 h-20 flex-none rounded-md overflow-hidden bg-gray-100">
                          {vImg ? (
                            <img
                              src={vImg}
                              alt={vAlt}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
                              aria-hidden="true"
                            >
                              No image
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-sm">
                          <strong className="block">{v?.name || "Untitled venue"}</strong>
                          {v?.description && (
                            <span className="block text-gray-600 line-clamp-2">
                              {v.description}
                            </span>
                          )}
                          {Number.isFinite(Number(v?.maxGuests)) && (
                            <span className="block">Max Guests: {v.maxGuests}</span>
                          )}
                          {v?.id && (
                            <Link
                              to={`/venues/${v.id}`}
                              className="text-blue-600 underline text-sm"
                            >
                              View venue
                            </Link>
                          )}
                        </div>

                        {/* Right-side action: link to My Venues (replacing per-card Edit) */}
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            to="/profile?tab=venues"
                            className="text-sm rounded-md border px-3 py-1.5"
                          >
                            My Venues
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-600">You have no venues yet.</p>
            )}
          </section>
        )}

        {/* Upcoming Bookings (with venue thumbnail + avatar chip + actions) */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Upcoming Bookings</h2>
          {upcoming.length > 0 ? (
            <ul className="space-y-2">
              {upcoming.map((b) => {
                const isEditing = editingId === b?.id;
                const v = b?.venue || {};
                const vImg = mediaUrl(v);
                const vAlt = mediaAlt(v);

                return (
                  <li
                    key={b?.id || `${v?.id || "v"}-${b?.dateFrom || Math.random()}`}
                    className="border rounded p-3 bg-white"
                  >
                    {!isEditing ? (
                      <div className="flex items-start gap-3">
                        {/* Venue thumbnail */}
                        <div className="relative w-24 h-20 flex-none rounded-md overflow-hidden bg-gray-100">
                          {vImg ? (
                            <img
                              src={vImg}
                              alt={vAlt}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
                              aria-hidden="true"
                            >
                              No image
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-sm">
                          <strong className="block">{v?.name || "Unknown venue"}</strong>
                          <span className="block">{fmtRange(b?.dateFrom, b?.dateTo)}</span>
                          {Number.isFinite(Number(b?.guests)) && (
                            <span className="block">Guests: {b.guests}</span>
                          )}
                          {v?.id && (
                            <Link
                              to={`/venues/${v.id}`}
                              className="text-blue-600 underline text-sm"
                            >
                              View venue
                            </Link>
                          )}
                        </div>

                        {/* Right-side actions + avatar chip stacked */}
                        <div className="flex flex-col items-end gap-2">
                          {/* Avatar chip */}
                          {(user?.avatar?.url || authProfile?.avatar?.url) ? (
                            <img
                              src={user?.avatar?.url || authProfile?.avatar?.url}
                              alt={`${user?.name || authProfile?.name || "User"} avatar`}
                              className="w-8 h-8 rounded-full object-cover border"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 border"
                              aria-hidden="true"
                              title="No avatar"
                            >
                              {(user?.name || "U").slice(0, 1).toUpperCase()}
                            </div>
                          )}

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
                      </div>
                    ) : (
                      <form
                        onSubmit={submitEdit}
                        className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end"
                      >
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

        {/* Past Bookings (with venue thumbnail) */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Past Bookings</h2>
          {past.length > 0 ? (
            <ul className="space-y-2">
              {past.map((b) => {
                const v = b?.venue || {};
                const vImg = mediaUrl(v);
                const vAlt = mediaAlt(v);

                return (
                  <li
                    key={b?.id || `${v?.id || "v"}-${b?.dateTo || Math.random()}`}
                    className="border rounded p-3 bg-white"
                  >
                    <div className="flex items-start gap-3">
                      {/* Venue thumbnail */}
                      <div className="relative w-24 h-20 flex-none rounded-md overflow-hidden bg-gray-100">
                        {vImg ? (
                          <img
                            src={vImg}
                            alt={vAlt}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
                            aria-hidden="true"
                          >
                            No image
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 text-sm">
                        <strong className="block">{v?.name || "Unknown venue"}</strong>
                        <span className="block">{fmtRange(b?.dateFrom, b?.dateTo)}</span>
                        {Number.isFinite(Number(b?.guests)) && (
                          <span className="block">Guests: {b.guests}</span>
                        )}
                        {v?.id && (
                          <Link
                            to={`/venues/${v.id}`}
                            className="text-blue-600 underline text-sm"
                          >
                            View venue
                          </Link>
                        )}
                      </div>

                      {/* Completed tag */}
                      <span className="text-xs text-gray-500 flex-none">Completed</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-600">No past bookings.</p>
          )}
        </section>
      </div>
    </div>
  );
}
