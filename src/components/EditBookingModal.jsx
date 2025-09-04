/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useEffect, useState } from "react";
import { updateBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext";

export default function EditBookingModal({ open, booking, onClose, onSaved }) {
  const { token } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!booking) return;
    setStartDate(booking.dateFrom?.slice(0, 10) || "");
    setEndDate(booking.dateTo?.slice(0, 10) || "");
    setGuests(booking.guests || 1);
  }, [booking]);

  if (!open || !booking) return null;

  const venue = booking.venue;

  const handleSave = async () => {
    setError("");
    const guestsInt = parseInt(guests, 10);

    if (!startDate || !endDate || isNaN(guestsInt)) {
      setError("All fields are required.");
      return;
    }

    if (guestsInt < 1 || guestsInt > 10) {
      setError("Guests must be between 1 and 10.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before end date.");
      return;
    }

    if (!token) {
      setError("You must be logged in.");
      return;
    }

    try {
      setSaving(true);

      const updated = await updateBooking(
        booking.id,
        {
          dateFrom: startDate,
          dateTo: endDate,
          guests: guestsInt,
        },
        {
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      );

      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow space-y-6">
        <h2 className="text-xl font-semibold">Edit Booking</h2>

        {/* Venue Info */}

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border px-3 py-2 rounded text-sm"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border px-3 py-2 rounded text-sm"
          />
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium mb-1">Guests</label>
          <input
            type="number"
            min="1"
            max="10"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full border px-3 py-2 rounded text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
