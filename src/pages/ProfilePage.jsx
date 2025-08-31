// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfileBookings, deleteBooking } from "../api/bookings";
import ProfileSettingsForm from "../components/ProfileSettingsForm";
import BookingList from "../components/BookingList";
import EditBookingModal from "../components/EditBookingModal";
import { saveProfileAndRefresh } from "../logic/profileSync";
import MyVenuesPage from "./MyVenuesPage";

export default function ProfilePage() {
  const { isAuthed, loading: authLoading, profile, setProfile } = useAuth();

  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [busyId, setBusyId] = useState(null);
  const [edit, setEdit] = useState({ open: false, booking: null });

  // local feedback for settings save
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");

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

  function onEdit(b) {
    setEdit({ open: true, booking: b });
  }
  function onEditClose() {
    setEdit({ open: false, booking: null });
  }
  function onEditSaved(updated) {
    // merge updated fields into the row
    setState((s) => ({
      ...s,
      rows: s.rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
    }));
  }

  // Save profile via helper → persist locally → (optionally) refresh my venues list
  async function handleSaveProfile(changes) {
    if (!profile?.name) return;
    setSavingSettings(true);
    setSettingsError("");
    try {
      const { profile: updated /*, venues */ } = await saveProfileAndRefresh({
        name: profile.name,
        changes,
        withBookings: true,
        // if your AuthContext exposes applyProfile, you can pass it here too
        // applyProfile,
      });
      // Update UI profile immediately
      setProfile?.(updated);
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.message || err?.message || "Failed to update profile";
      setSettingsError(msg);
      console.error("saveProfileAndRefresh failed:", err);
    } finally {
      setSavingSettings(false);
    }
  }

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

      {/* Profile settings */}
      <ProfileSettingsForm
        profile={profile}
        onSave={handleSaveProfile} // ← call with { bio, venueManager, avatarUrl, avatarAlt, bannerUrl, bannerAlt }
        onProfileUpdated={(u) => setProfile?.(u)} // keep for compatibility
        saving={savingSettings}
        error={settingsError}
      />

      {profile?.venueManager && (
        <div>
          <h2 className="text-2xl font-semibold mt-10 mb-4">My Venues</h2>
          <MyVenuesPage embedded />
        </div>
      )}

      {/* Bookings */}
      {state.loading ? (
        <p>Loading bookings…</p>
      ) : state.error ? (
        <p className="text-red-600">{state.error}</p>
      ) : (
        <>
          <BookingList
            title="Upcoming bookings"
            bookings={upcoming}
            emptyText="You have no upcoming bookings."
            onEdit={onEdit}
            onCancel={onCancel}
            busyId={busyId}
          />
          <BookingList
            title="Past bookings"
            bookings={past}
            emptyText="No past bookings yet."
            showAgain
          />
        </>
      )}

      {/* Edit modal */}
      <EditBookingModal
        open={edit.open}
        booking={edit.booking}
        onClose={onEditClose}
        onSaved={onEditSaved}
      />
    </div>
  );
}
