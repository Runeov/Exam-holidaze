// src/components/VenueForm.jsx
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useEffect, useId, useState } from "react";

export default function VenueForm({ mode = "create", initial = {}, onSubmit, submitting, error }) {
  const [venue, setVenue] = useState({
    name: "",
    description: "",
    media: [{ url: "", alt: "" }],
    price: 0,
    maxGuests: 1,
    rating: 0,
    location: {
      address: "",
      city: "",
      zip: "",
      country: "",
      continent: "",
      lat: 0,
      lng: 0,
    },
    meta: { wifi: false, parking: false, breakfast: false, pets: false },
  });

  // ---- IDs (WCAG + Biome) ----
  const uid = useId();
  const idName = `${uid}-name`;
  const idDesc = `${uid}-desc`;
  const idMedia = `${uid}-media`;
  const idPrice = `${uid}-price`;
  const idGuests = `${uid}-guests`;

  const idAddr = `${uid}-loc-address`;
  const idCity = `${uid}-loc-city`;
  const idZip = `${uid}-loc-zip`;
  const idCountry = `${uid}-loc-country`;
  const idCont = `${uid}-loc-continent`;
  const idLat = `${uid}-loc-lat`;
  const idLng = `${uid}-loc-lng`;

  // ---- Styles (tokens) ----
  const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[--color-ring] bg-[--color-surface] " +
    "px-4 py-2 text-[--color-text] placeholder:text-[--color-text-muted] " +
    "focus:outline-none focus:ring-2 ring-[--color-brand-500] transition shadow-sm";
  const labelBase = "block font-medium mb-1 text-[--color-text]";
  const smallInput =
    "w-full rounded-[var(--radius-md)] border border-[--color-ring] bg-[--color-surface] " +
    "px-2 py-1 text-[--color-text] placeholder:text-[--color-text-muted] " +
    "focus:outline-none focus:ring-2 ring-[--color-brand-500] transition shadow-sm";

  useEffect(() => {
    if (initial && mode === "edit") {
      setVenue((prev) => ({
        ...prev,
        ...initial,
        location: { ...prev.location, ...initial.location },
        meta: { ...prev.meta, ...initial.meta },
        media: initial.media?.length ? initial.media : prev.media,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, mode]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setVenue((v) => ({
        ...v,
        location: {
          ...v.location,
          [key]: key === "lat" || key === "lng" ? (value === "" ? "" : Number(value)) : value,
        },
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

    // Coerce lat/lng to numbers per schema (default 0)
    const latNum = venue.location.lat === "" ? 0 : Number(venue.location.lat);
    const lngNum = venue.location.lng === "" ? 0 : Number(venue.location.lng);

    const payload = {
      ...venue,
      location: {
        ...venue.location,
        lat: Number.isFinite(latNum) ? latNum : 0,
        lng: Number.isFinite(lngNum) ? lngNum : 0,
      },
    };

    onSubmit?.(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label htmlFor={idName} className={labelBase}>
          Venue Name
        </label>
        <input
          id={idName}
          type="text"
          name="name"
          value={venue.name}
          onChange={handleChange}
          className={inputBase}
          placeholder="Cozy Cabin by the Lake"
          required
        />
      </div>

      <div>
        <label htmlFor={idDesc} className={labelBase}>
          Description
        </label>
        <textarea
          id={idDesc}
          name="description"
          value={venue.description}
          onChange={handleChange}
          rows={4}
          className={inputBase}
          placeholder="Tell guests what makes this place special…"
        />
      </div>

      <div>
        <label htmlFor={idMedia} className={labelBase}>
          Image URL
        </label>
        <input
          id={idMedia}
          type="url"
          name="media"
          value={venue.media[0]?.url || ""}
          onChange={handleMediaChange}
          className={inputBase}
          placeholder="https://…/photo.jpg"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm text-[--color-text]" htmlFor={idPrice}>
          Price per night
          <input
            id={idPrice}
            type="number"
            name="price"
            value={venue.price}
            onChange={handleChange}
            className={`${smallInput} mt-1`}
            min={0}
            placeholder="120"
          />
        </label>
        <label className="block text-sm text-[--color-text]" htmlFor={idGuests}>
          Max guests
          <input
            id={idGuests}
            type="number"
            name="maxGuests"
            value={venue.maxGuests}
            onChange={handleChange}
            className={`${smallInput} mt-1`}
            min={1}
            placeholder="1"
          />
        </label>
      </div>

      {/* Location: address/city/zip/country/continent/lat/lng */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor={idAddr} className={labelBase}>
            Address
          </label>
          <input
            id={idAddr}
            type="text"
            name="location.address"
            value={venue.location.address}
            onChange={handleChange}
            className={inputBase}
            placeholder="123 Forest Ln"
            autoComplete="address-line1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm text-[--color-text]" htmlFor={idCity}>
            City
            <input
              id={idCity}
              type="text"
              name="location.city"
              value={venue.location.city}
              onChange={handleChange}
              className={`${smallInput} mt-1`}
              placeholder="Mystwood"
              autoComplete="address-level2"
            />
          </label>
          <label className="block text-sm text-[--color-text]" htmlFor={idZip}>
            ZIP / Postal code
            <input
              id={idZip}
              type="text"
              name="location.zip"
              value={venue.location.zip}
              onChange={handleChange}
              className={`${smallInput} mt-1`}
              placeholder="10101"
              autoComplete="postal-code"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm text-[--color-text]" htmlFor={idCountry}>
            Country
            <input
              id={idCountry}
              type="text"
              name="location.country"
              value={venue.location.country}
              onChange={handleChange}
              className={`${smallInput} mt-1`}
              placeholder="USA"
              autoComplete="country-name"
            />
          </label>
          <label className="block text-sm text-[--color-text]" htmlFor={idCont}>
            Continent
            <input
              id={idCont}
              type="text"
              name="location.continent"
              value={venue.location.continent}
              onChange={handleChange}
              className={`${smallInput} mt-1`}
              placeholder="North America"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm text-[--color-text]" htmlFor={idLat}>
            Latitude
            <input
              id={idLat}
              type="number"
              step="any"
              inputMode="decimal"
              name="location.lat"
              value={venue.location.lat}
              onChange={handleChange}
              className={`${smallInput} mt-1`}
              placeholder="62.4722"
              aria-describedby={`${idLat}-hint`}
            />
            <span id={`${idLat}-hint`} className="block text-xs text-[--color-text-muted] mt-1">
              Decimal degrees (−90 to 90)
            </span>
          </label>

          <label className="block text-sm text-[--color-text]" htmlFor={idLng}>
            Longitude
            <input
              id={idLng}
              type="number"
              step="any"
              inputMode="decimal"
              name="location.lng"
              value={venue.location.lng}
              onChange={handleChange}
              className={`${smallInput} mt-1`}
              placeholder="6.1495"
              aria-describedby={`${idLng}-hint`}
            />
            <span id={`${idLng}-hint`} className="block text-xs text-[--color-text-muted] mt-1">
              Decimal degrees (−180 to 180)
            </span>
          </label>
        </div>
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium text-[--color-text]">Amenities</legend>
        {["wifi", "parking", "breakfast", "pets"].map((key) => {
          const cid = `${uid}-meta-${key}`;
          return (
            <label key={key} htmlFor={cid} className="block text-sm text-[--color-text]">
              <input
                id={cid}
                type="checkbox"
                name={`meta.${key}`}
                checked={venue.meta[key]}
                onChange={handleChange}
                className="mr-2 h-4 w-4 rounded border-[--color-ring] text-[--color-brand-500] focus:outline-none focus:ring-2 ring-[--color-brand-500]"
              />
              {key}
            </label>
          );
        })}
      </fieldset>

      {error && <p className="text-[--color-error-500] text-sm">{error}</p>}

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
        className="w-full inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 ring-[--color-accent-500] ring-offset-2 text-base px-4 py-2 ring-[color:var(--color-accent-500)] bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent-700)] active:scale-[0.98]"
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
