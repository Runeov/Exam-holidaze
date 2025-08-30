// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfileBookings } from "../api/bookings";

function fmt(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!user?.name) {
        setState({ loading: false, error: "You must be logged in.", rows: [] });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const { data } = await getProfileBookings(user.name, {
          withVenue: true, // expands venue data for names
          sort: "dateFrom",
          sortOrder: "asc",
          limit: 100,
        });

        if (!alive) return;

        // Show upcoming only (today onwards)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = (data ?? []).filter((b) => new Date(b.dateFrom) >= today);

        setState({ loading: false, error: null, rows: upcoming });
      } catch (err) {
        if (!alive) return;
        setState({ loading: false, error: err.message || "Failed to load", rows: [] });
      }
    }
    if (!loading) run();
    return () => {
      alive = false;
    };
  }, [user?.name, loading]);

  if (loading || state.loading) return <div className="p-4">Loading…</div>;
  if (state.error) return <div className="p-4 text-red-600">Error: {state.error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My upcoming bookings</h1>

      {state.rows.length === 0 ? (
        <p>No upcoming bookings yet.</p>
      ) : (
        <ul className="grid gap-3">
          {state.rows.map((b) => (
            <li key={b.id} className="rounded-lg border p-3 shadow-sm">
              <div className="font-medium">{b?.venue?.name ?? "—"}</div>
              <div className="text-sm opacity-80">
                {fmt(b.dateFrom)} → {fmt(b.dateTo)} • {b.guests} guest{b.guests === 1 ? "" : "s"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
