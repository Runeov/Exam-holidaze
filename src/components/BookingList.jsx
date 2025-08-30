// src/components/BookingList.jsx
import React from "react";
import { Link } from "react-router-dom";
import { fmt, nightsBetween } from "../utils/dates";

export default function BookingList({
  title,
  bookings,
  emptyText = "No bookings.",
  onEdit, // optional: (booking) => void
  onCancel, // optional: (bookingId) => void
  busyId, // optional: currently cancelling id
  showAgain = false,
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {!bookings || bookings.length === 0 ? (
        <p className="text-gray-600">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
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
                    {fmt(b.dateFrom)} → {fmt(b.dateTo)} • {nights} night{nights === 1 ? "" : "s"} •{" "}
                    {b.guests} guest{b.guests === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {typeof onEdit === "function" && (
                    <button
                      type="button"
                      onClick={() => onEdit(b)}
                      className="px-3 py-2 rounded-lg border font-medium"
                    >
                      Edit
                    </button>
                  )}
                  {typeof onCancel === "function" && (
                    <button
                      type="button"
                      onClick={() => onCancel(b.id)}
                      disabled={busyId === b.id}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-60"
                    >
                      {busyId === b.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                  {showAgain && v.id && (
                    <Link
                      to={`/venues/${v.id}`}
                      className="px-3 py-2 rounded-lg border font-medium"
                    >
                      Book again
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
