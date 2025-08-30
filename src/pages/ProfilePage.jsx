// src/pages/ProfilePage.jsx
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfileBookings, updateBooking, deleteBooking } from "../api/bookings";
import { getProfile, updateProfile } from "../api/profiles";

const fmt = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function ProfilePage() {
  const { profile, loading: authLoading, isAuthed, apiKey } = useAuth();

  // BOOKINGS STATE
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({ dateFrom: "", dateTo: "", guests: 1 });
  const [busyId, setBusyId] = useState(null);
  const [inlineMsg, setInlineMsg] = useState("");

  // PROFILE STATE
  const [pLoading, setPLoading] = useState(true);
  const [pError, setPError] = useState("");
  const [pData, setPData] = useState(null);
  const maskedKey = useMemo(
    () => (apiKey ? `${String(apiKey).slice(0, 6)}…${String(apiKey).slice(-4)}` : "—"),
    [apiKey],
  );

  // ---- LOAD PROFILE (fresh) ----
  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      if (authLoading || !isAuthed || !profile?.name) return;
      setPLoading(true);
      setPError("");
      try {
        const full = await getProfile(profile.name);
        if (!alive) return;
        setPData(full);
      } catch (e) {
        if (!alive) return;
        setPError(e?.message || "Failed to load profile");
      } finally {
        if (alive) setPLoading(false);
      }
    }
    loadProfile();
    return () => {
      alive = false;
    };
  }, [authLoading, isAuthed, profile?.name]);

  // ---- LOAD BOOKINGS ----
  useEffect(() => {
    let alive = true;
    async function run() {
      if (authLoading) return;
      if (!isAuthed || !profile?.name) {
        setState({ loading: false, error: "You must be logged in.", rows: [] });
        return;
      }

      try {
        const res = await getProfileBookings(profile.name, {
          includeVenue: true,
          includeCustomer: true,
          sort: "dateFrom",
          sortOrder: "asc",
          page: 1,
          limit: 50,
        });
        if (!alive) return;
        setState({ loading: false, error: null, rows: res?.data ?? [] });
      } catch (err) {
        if (!alive) return;
        setState({ loading: false, error: err.message || "Failed to load", rows: [] });
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [authLoading, isAuthed, profile?.name]);

  // ---- PROFILE SAVE ----
  async function onSaveProfile(e) {
    e.preventDefault();
    if (!pData || !profile?.name) return;

    setPError("");
    setPLoading(true);

    const payload = {
      bio: pData?.bio ?? "",
      avatar: pData?.avatar?.url
        ? { url: pData.avatar.url, alt: pData?.avatar?.alt || pData?.name || "Avatar" }
        : undefined,
    };

    try {
      const saved = await updateProfile(profile.name, payload);
      setPData(saved);
    } catch (e) {
      setPError(e?.response?.data?.errors?.[0]?.message || e?.message || "Update failed");
    } finally {
      setPLoading(false);
    }
  }

  // ---- BOOKINGS EDIT/DELETE ----
  function startEdit(b) {
    setEditingId(b.id);
    setInlineMsg("");
    setEditFields({
      dateFrom: b.dateFrom ? new Date(b.dateFrom).toISOString().slice(0, 10) : "",
      dateTo: b.dateTo ? new Date(b.dateTo).toISOString().slice(0, 10) : "",
      guests: b.guests ?? 1,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setInlineMsg("");
  }

  function validateEdit() {
    const { dateFrom, dateTo, guests } = editFields;
    if (!dateFrom || !dateTo) return "Select both start and end dates.";
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) return "Start date cannot be in the past.";
    if (end <= start) return "End date must be after start date.";
    if (!guests || guests < 1) return "Guests must be at least 1.";
    return "";
  }

  async function saveEdit(id) {
    const err = validateEdit();
    if (err) {
      setInlineMsg(err);
      return;
    }

    setBusyId(id);
    setInlineMsg("");
    try {
      const payload = {
        dateFrom: new Date(editFields.dateFrom).toISOString(),
        dateTo: new Date(editFields.dateTo).toISOString(),
        guests: Number(editFields.guests),
      };
      const updated = await updateBooking(id, payload);

      // Optimistic update of local list
      setState((s) => ({
        ...s,
        rows: s.rows.map((b) => (b.id === id ? { ...b, ...updated } : b)),
      }));

      setInlineMsg("Saved!");
      setEditingId(null);
    } catch (e) {
      setInlineMsg(e?.response?.data?.errors?.[0]?.message || e?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeBooking(id) {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    setBusyId(id);
    setInlineMsg("");
    try {
      await deleteBooking(id);
      setState((s) => ({ ...s, rows: s.rows.filter((b) => b.id !== id) }));
    } catch (e) {
      setInlineMsg(e?.response?.data?.errors?.[0]?.message || e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  // ---- RENDER ----
  if (authLoading || state.loading) return <div className="p-4">Loading…</div>;
  if (state.error) return <div className="p-4 text-red-600">Error: {state.error}</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Profile Info + Editor */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>

        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border">
            <img
              src={pData?.avatar?.url || "https://placehold.co/200x200?text=Avatar"}
              alt={pData?.avatar?.alt || pData?.name || "Avatar"}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 grid gap-1">
            <p>
              <span className="font-medium">Name:</span> {pData?.name || profile?.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {pData?.email || profile?.email}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">API Key:</span> {maskedKey}
            </p>
          </div>
        </div>

        <form onSubmit={onSaveProfile} className="mt-6 grid gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Avatar URL</label>
            <input
              type="url"
              value={pData?.avatar?.url || ""}
              onChange={(e) =>
                setPData((d) => ({ ...d, avatar: { ...(d?.avatar || {}), url: e.target.value } }))
              }
              placeholder="https://…"
              className="w-full rounded border px-2 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Avatar Alt</label>
            <input
              type="text"
              value={pData?.avatar?.alt || ""}
              onChange={(e) =>
                setPData((d) => ({ ...d, avatar: { ...(d?.avatar || {}), alt: e.target.value } }))
              }
              placeholder="Your avatar description"
              className="w-full rounded border px-2 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={pData?.bio || ""}
              onChange={(e) => setPData((d) => ({ ...d, bio: e.target.value }))}
              rows={3}
              className="w-full rounded border px-2 py-2"
              placeholder="Tell guests about yourself…"
            />
          </div>

          {pError && <p className="text-sm text-red-600">{pError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pLoading}
              className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-60"
            >
              {pLoading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Bookings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">My bookings</h2>

        {state.rows.length === 0 ? (
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-6 text-center text-gray-600">
            No bookings yet
          </div>
        ) : (
          <ul className="grid gap-4">
            {state.rows.map((b) => {
              const isEditing = editingId === b.id;
              return (
                <li key={b.id} className="rounded-lg border p-4 shadow-sm bg-white space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{b?.venue?.name ?? "—"}</div>

                      {!isEditing ? (
                        <div className="text-sm opacity-80">
                          {fmt(b.dateFrom)} → {fmt(b.dateTo)} • {b.guests} guest
                          {b.guests === 1 ? "" : "s"}
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-3 gap-2 mt-1">
                          <label className="text-sm">
                            <span className="block mb-1">From</span>
                            <input
                              type="date"
                              value={editFields.dateFrom}
                              onChange={(e) =>
                                setEditFields((f) => ({ ...f, dateFrom: e.target.value }))
                              }
                              className="w-full rounded border px-2 py-1"
                              required
                            />
                          </label>
                          <label className="text-sm">
                            <span className="block mb-1">To</span>
                            <input
                              type="date"
                              value={editFields.dateTo}
                              onChange={(e) =>
                                setEditFields((f) => ({ ...f, dateTo: e.target.value }))
                              }
                              className="w-full rounded border px-2 py-1"
                              required
                            />
                          </label>
                          <label className="text-sm">
                            <span className="block mb-1">Guests</span>
                            <input
                              type="number"
                              min={1}
                              value={editFields.guests}
                              onChange={(e) =>
                                setEditFields((f) => ({ ...f, guests: Number(e.target.value) }))
                              }
                              className="w-full rounded border px-2 py-1"
                              required
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(b)}
                            className="px-3 py-1 rounded border hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBooking(b.id)}
                            disabled={busyId === b.id}
                            className="px-3 py-1 rounded border text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            {busyId === b.id ? "Deleting…" : "Delete"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(b.id)}
                            disabled={busyId === b.id}
                            className="px-3 py-1 rounded bg-gray-900 text-white hover:opacity-90 disabled:opacity-60"
                          >
                            {busyId === b.id ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1 rounded border hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing && inlineMsg && (
                    <p
                      className={`text-sm mt-1 ${
                        inlineMsg.toLowerCase().includes("save") ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {inlineMsg}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
