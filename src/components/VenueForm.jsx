// src/components/VenueForm.jsx
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useEffect, useState } from "react";

export default function VenueForm({ mode = "create", initial = {}, onSubmit, submitting, error }) {
  const [venue, setVenue] = useState({
    name: "",
    description: "",
    media: [{ url: "", alt: "" }],
    price: 0,
    maxGuests: 1,
    rating: 0,
    location: { address: "", city: "", country: "" },
    meta: { wifi: false, parking: false, breakfast: false, pets: false },
  });

  useEffect(() => {
    if (initial && mode === "edit") {
      setVenue({
        ...venue,
        ...initial,
        location: { ...venue.location, ...initial.location },
        meta: { ...venue.meta, ...initial.meta },
        media: initial.media?.length ? initial.media : venue.media,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, mode, venue, venue.location, venue.meta, venue.media]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setVenue((v) => ({
        ...v,
        location: { ...v.location, [key]: value },
      }));
    } else if (name.startsWith("meta.")) {
      const key = name.split(".")[1];
      setVenue((v) => ({
        ...v,
        meta: { ...v.meta, [key]: checked },
      }));
    } else {
      setVenue((v) => ({ ...v, [name]: type === "number" ? Number(value) : value }));
    }
  }

  function handleMediaChange(e) {
    setVenue((v) => ({
      ...v,
      media: [{ ...v.media[0], url: e.target.value }],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.(venue);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block font-medium mb-1">Venue Name</label>
        <input
          type="text"
          name="name"
          value={venue.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={venue.description}
          onChange={handleChange}
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Image URL</label>
        <input
          type="url"
          name="media"
          value={venue.media[0]?.url || ""}
          onChange={handleMediaChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          Price per night
          <input
            type="number"
            name="price"
            value={venue.price}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            min={0}
          />
        </label>
        <label className="block text-sm">
          Max guests
          <input
            type="number"
            name="maxGuests"
            value={venue.maxGuests}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            min={1}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          City
          <input
            type="text"
            name="location.city"
            value={venue.location.city}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block text-sm">
          Country
          <input
            type="text"
            name="location.country"
            value={venue.location.country}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          />
        </label>
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Amenities</legend>
        {["wifi", "parking", "breakfast", "pets"].map((key) => (
          <label key={key} className="block text-sm">
            <input
              type="checkbox"
              name={`meta.${key}`}
              checked={venue.meta[key]}
              onChange={handleChange}
              className="mr-2"
            />
            {key}
          </label>
        ))}
      </fieldset>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        aria-label={
          submitting
            ? mode === "edit"
              ? "Saving venue"
              : "Creating venue"
            : mode === "edit"
              ? "Save venue"
              : "Create venue"
        }
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold disabled:opacity-60"
      >
        {submitting
          ? mode === "edit"
            ? "Saving…"
            : "Creating…"
          : mode === "edit"
            ? "Save Venue"
            : "Create Venue"}
      </button>
    </form>
  );
}
