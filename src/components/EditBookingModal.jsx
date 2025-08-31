// src/components/EditBookingModal.jsx
import { useEffect, useState } from "react";
import { getAuthHeaders } from "../api/auth";
import { updateBooking } from "../api/bookings";
import { hasOverlapExcluding, toIsoZMidnight } from "../utils/dates";
import BookingCalendar from "./BookingCalendar";

const API = "https://v2.api.noroff.dev";

export default function EditBookingModal({ open, booking, onClose, onSaved }) {
  const [range, setRange] = useState({ from: null, to: null });
  const [guests, setGuests] = useState(1);
  const [venueBookings, setVenueBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Hydrate state when opening
  useEffect(() => {
    if (!open || !booking) return;
    setRange({ from: new Date(booking.dateFrom), to: new Date(booking.dateTo) });
    setGuests(booking.guests || 1);
    setError("");

    // fetch latest bookings for this venue
    if (booking?.venue?.id) {
      setLoading(true);
      fetch(`${API}/holidaze/venues/${booking.venue.id}?_bookings=true`, {
        headers: { ...getAuthHeaders() },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Failed to load venue (${res.status})`);
          const { data } = await res.json();
          setVenueBookings(data?.bookings || []);
          setLoading(false);
        })
        .catch((e) => {
          console.error("[EditBookingModal] venue fetch failed", e);
          setError("Could not load venue bookings.");
          setLoading(false);
        });
    }
  }, [open, booking]);

  async function onSave() {
    if (!booking) return;
    if (!range?.from || !range?.to) {
      setError("Please select both start and end dates.");
      return;
    }
    if (guests < 1) {
      setError("Guests must be at least 1.");
      return;
    }

    const bookingId = booking.id;
    const venueId = booking.venue?.id;
    const dateFromIso = toIsoZMidnight(range.from);
    const dateToIso = toIsoZMidnight(range.to);

    try {
      setSaving(true);
      setError("");

      // fresh preflight
      const pre = await fetch(`${API}/holidaze/venues/${venueId}?_bookings=true`, {
        headers: { ...getAuthHeaders() },
      });
      if (!pre.ok) throw new Error(`Preflight failed (${pre.status})`);
      const { data: v } = await pre.json();

      if (hasOverlapExcluding(v?.bookings || [], dateFromIso, dateToIso, bookingId)) {
        setSaving(false);
        setError("Those dates overlap another booking for this venue.");
        return;
      }

      const updated = await updateBooking(bookingId, {
        dateFrom: dateFromIso,
        dateTo: dateToIso,
        guests,
      });

      onSaved?.({
        id: bookingId,
        dateFrom: updated.dateFrom ?? dateFromIso,
        dateTo: updated.dateTo ?? dateToIso,
        guests: updated.guests ?? guests,
      });

      onClose?.();
    } catch (e) {
      console.error("[EditBookingModal] save failed", e);
      setError(e?.message || "Failed to update booking.");
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Edit booking</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>

        {loading ? (
          <p>Loading venue bookings…</p>
        ) : (
          <>
            <div className="space-y-2">
              <span className="block text-sm font-medium">Choose new dates</span>
              <BookingCalendar
                bookings={venueBookings}
                selected={range}
                onSelect={(next) => {
                  setRange(next || { from: null, to: null });
                  setError("");
                }}
                minDate={new Date()}
              />
            </div>

            <label className="text-sm block">
              <span className="block mb-1">Guests</span>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => {
                  setGuests(Number(e.target.value));
                  setError("");
                }}
                className="w-full rounded border px-2 py-1"
                required
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border">
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
