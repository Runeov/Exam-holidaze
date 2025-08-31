// src/components/EditVenueModal.jsx
import { useEffect, useState } from "react";
import { getVenue, updateVenue } from "../api/venues";

export default function EditVenueModal({ open, venueId, onClose, onSaved }) {
  const [venue, setVenue] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch venue data when opening
  useEffect(() => {
    if (!open || !venueId) return;

    setLoading(true);
    getVenue(venueId, { withBookings: false, withOwner: true })
      .then((res) => {
        setVenue(res?.data?.data ?? res?.data);
        setLoading(false);
        setError("");
      })
      .catch((_e) => {
        setError("Failed to load venue");
        setLoading(false);
      });
  }, [open, venueId]);

  function onChange(e) {
    const { name, value } = e.target;
    setVenue((v) => ({ ...v, [name]: value }));
  }

  async function onSave() {
    if (!venueId || !venue?.name) return;

    setSaving(true);
    setError("");

    try {
      const updated = await updateVenue(venueId, {
        name: venue.name,
        description: venue.description,
        price: Number(venue.price),
        maxGuests: Number(venue.maxGuests),
      });

      onSaved?.(updated);
      onClose?.();
    } catch (e) {
      setError(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Venue</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>

        {loading ? (
          <p>Loading venue…</p>
        ) : (
          <>
            <label className="block text-sm">
              Name
              <input
                name="name"
                value={venue?.name || ""}
                onChange={onChange}
                className="w-full border rounded px-2 py-1"
              />
            </label>

            <label className="block text-sm">
              Description
              <textarea
                name="description"
                value={venue?.description || ""}
                onChange={onChange}
                rows={3}
                className="w-full border rounded px-2 py-1"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                Price
                <input
                  type="number"
                  name="price"
                  value={venue?.price || 0}
                  onChange={onChange}
                  className="w-full border rounded px-2 py-1"
                />
              </label>
              <label className="block text-sm">
                Max Guests
                <input
                  type="number"
                  name="maxGuests"
                  value={venue?.maxGuests || 1}
                  onChange={onChange}
                  className="w-full border rounded px-2 py-1"
                />
              </label>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={onClose} className="border rounded px-3 py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="bg-blue-600 text-white rounded px-4 py-2 font-medium disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
