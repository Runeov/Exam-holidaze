// src/pages/UserProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProfile } from "../api/profiles";

export default function UserProfilePage() {
  const { name } = useParams();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        setStatus("loading");
        const res = await getProfile(name, {
          withBookings: true,
          withVenues: true,
        });
        setUser(res?.data?.data ?? res?.data);
        setStatus("idle");
      } catch (err) {
        console.error("Failed to load user profile", err);
        setError("Could not load user profile.");
        setStatus("error");
      }
    }
    if (name) fetchUser();
  }, [name]);

  if (status === "loading") return <p className="p-6">Loading profile…</p>;
  if (status === "error") return <p className="p-6 text-red-600">{error}</p>;
  if (!user) return <p className="p-6">User not found.</p>;

  const now = new Date();
  const past = (user.bookings || []).filter((b) => new Date(b.dateTo) < now);
  const upcoming = (user.bookings || []).filter((b) => new Date(b.dateTo) >= now);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{user.name}</h1>

        <p className="text-gray-600">{user.email}</p>
        {user.avatar?.url && (
          <img
            src={user.avatar.url}
            alt={user.avatar.alt || "User avatar"}
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
        <div>
          <Link to={`/users/${user.name}`} className="text-blue-600 underline text-sm">
            View public profile
          </Link>
        </div>
        {user.venueManager && (
          <div>
            <p className="text-sm text-gray-700">
              Host:{" "}
              <Link to={`/users/${user.name}`} className="text-blue-600 underline">
                {user.name}
              </Link>
            </p>
          </div>
        )}
      </header>

      {user.venueManager && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Venues</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {user.venues?.map((v) => (
              <div key={v.id} className="border rounded-xl p-4">
                <h3 className="text-lg font-semibold">{v.name}</h3>
                <p className="text-sm text-gray-600">{v.description}</p>
                <p className="text-sm">Max Guests: {v.maxGuests}</p>
                <Link
                  to={`/venues/${v.id}`}
                  className="text-blue-600 underline text-sm mt-1 inline-block"
                >
                  View venue details
                </Link>
              </div>
            )) || <p>No venues found.</p>}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Upcoming Bookings</h2>
        {upcoming.length > 0 ? (
          <ul className="space-y-2">
            {upcoming.map((b) => (
              <li key={b.id} className="border rounded p-3">
                <p className="text-sm">
                  <strong>{b.venue?.name || "Unknown venue"}</strong>
                  <br />
                  {new Date(b.dateFrom).toLocaleDateString()} →{" "}
                  {new Date(b.dateTo).toLocaleDateString()}
                  <br />
                  Guests: {b.guests}
                  <br />
                  {b.venue?.id && (
                    <Link to={`/venues/${b.venue.id}`} className="text-blue-600 underline text-sm">
                      View venue
                    </Link>
                  )}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming bookings.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Past Bookings</h2>
        {past.length > 0 ? (
          <ul className="space-y-2">
            {past.map((b) => (
              <li key={b.id} className="border rounded p-3">
                <p className="text-sm">
                  <strong>{b.venue?.name || "Unknown venue"}</strong>
                  <br />
                  {new Date(b.dateFrom).toLocaleDateString()} →{" "}
                  {new Date(b.dateTo).toLocaleDateString()}
                  <br />
                  Guests: {b.guests}
                  <br />
                  {b.venue?.id && (
                    <Link to={`/venues/${b.venue.id}`} className="text-blue-600 underline text-sm">
                      View venue
                    </Link>
                  )}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No past bookings.</p>
        )}
      </section>
    </div>
  );
}
