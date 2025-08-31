// src/pages/MyVenuesPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyVenues, deleteVenue } from "../api/venues";
import EditVenueModal from "../components/EditVenueModal";
import EditBookingModal from "../components/EditBookingModal";
import { Link } from "react-router-dom";

export default function MyVenuesPage({ embedded = false }) {
  const { profile } = useAuth();
  const [venues, setVenues] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [edit, setEdit] = useState({ open: false, venueId: null });
  const [editBooking, setEditBooking] = useState({ open: false, booking: null });

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        const res = await getMyVenues(profile.name, { withBookings: true });
        const rows = res?.data?.data ?? res?.data;
        setVenues(rows);
        setStatus("idle");
      } catch (err) {
        console.error("Failed to load venues", err);
        setError("Could not load your venues.");
        setStatus("error");
      }
    }
    if (profile?.name) load();
  }, [profile?.name]);

  async function handleDelete(id) {
    const confirmDelete = confirm("Delete this venue?");
    if (!confirmDelete) return;
    try {
      await deleteVenue(id);
      setVenues((v) => v.filter((x) => x.id !== id));
    } catch (err) {
      alert("Failed to delete venue: " + (err?.message || ""));
    }
  }

  return (
    <section className={embedded ? "space-y-6" : "p-6 md:p-10"}>
      {!embedded && <h1 className="text-3xl font-bold mb-4">My Venues</h1>}

      {status === "loading" && <p>Loading…</p>}
      {status === "error" && <p className="text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {venues.map((venue) => (
          <div key={venue.id} className="border rounded-xl p-4 space-y-4 bg-white shadow">
            <Link
              to={`/venues/${venue.id}`}
              className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded"
            >
              <img
                src={venue.media?.[0]?.url || "https://placehold.co/300x200"}
                alt={venue.media?.[0]?.alt || venue.name}
                className="w-28 h-20 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{venue.name}</h2>
                <p className="text-sm text-gray-500">{venue.description}</p>
                <p className="text-sm">Bookings: {venue.bookings?.length || 0}</p>
              </div>
            </Link>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEdit({ open: true, venueId: venue.id })}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
              >
                Edit Venue
              </button>
              <button
                type="button"
                onClick={() => handleDelete(venue.id)}
                className="px-3 py-1 rounded bg-red-600 text-white text-sm"
              >
                Delete
              </button>
            </div>

            {venue.bookings?.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-1">Upcoming Bookings</h3>
                <ul className="space-y-1 text-sm">
                  {venue.bookings
                    .filter((b) => new Date(b.dateTo) >= new Date())
                    .sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom))
                    .map((b) => (
                      <li key={b.id} className="flex justify-between items-center">
                        <span>
                          {new Date(b.dateFrom).toLocaleDateString()} →{" "}
                          {new Date(b.dateTo).toLocaleDateString()} ({b.guests} guest
                          {b.guests > 1 ? "s" : ""})
                        </span>
                        {b.customer?.name ? (
                          <Link
                            to={`/users/${b.customer.name}`}
                            className="text-blue-600 text-sm underline ml-2"
                          >
                            by {b.customer.name}
                          </Link>
                        ) : (
                          <span className="text-gray-600 text-sm italic ml-2">by Unknown</span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <EditVenueModal
        open={edit.open}
        venueId={edit.venueId}
        onClose={() => setEdit({ open: false, venueId: null })}
        onSaved={(updated) => {
          setVenues((v) => v.map((x) => (x.id === updated.id ? updated : x)));
        }}
      />

      <EditBookingModal
        open={editBooking.open}
        booking={editBooking.booking}
        onClose={() => setEditBooking({ open: false, booking: null })}
        onSaved={(updated) => {
          setVenues((v) =>
            v.map((venue) =>
              venue.id === updated.venueId
                ? {
                    ...venue,
                    bookings: venue.bookings.map((b) =>
                      b.id === updated.id ? { ...b, ...updated } : b,
                    ),
                  }
                : venue,
            ),
          );
        }}
      />
    </section>
  );
}
