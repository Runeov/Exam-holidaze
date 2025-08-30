// src/pages/VenueDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getVenueById } from "../lib/api";

export default function VenueDetailsPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error

  useEffect(() => {
    async function run() {
      try {
        setStatus("loading");
        console.log("🔎 fetching venue", id);
        const v = await getVenueById(id);
        console.log("📦 venue data", v);
        setVenue(v);
        setStatus("idle");
      } catch (e) {
        console.error("❌ details fetch failed", e);
        setStatus("error");
      }
    }
    run();
  }, [id]);

  if (status === "loading") return <p className="p-6">Loading venue…</p>;
  if (status === "error") return <p className="p-6 text-red-600">Couldn’t load this venue.</p>;
  if (!venue) return <p className="p-6">No venue found.</p>;

  const image =
    venue?.media?.[0]?.url ||
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
  const rating = venue?.rating ?? 0;
  const { city = "", country = "" } = venue?.location || {};

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <Link to="/venues" className="text-sm underline">
          ← Back to all venues
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold">{venue?.name}</h1>
        <p className="text-gray-600">
          ★ {rating.toFixed(1)} • {city}
          {city && country ? ", " : ""}
          {country}
        </p>
      </header>

      <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[16/9]">
        <img src={image} alt={venue?.name || "Venue"} className="w-full h-full object-cover" />
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">About this place</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {venue?.description || "No description yet."}
          </p>

          {venue?.amenities?.length ? (
            <>
              <h3 className="text-lg font-semibold mt-4">Amenities</h3>
              <ul className="list-disc pl-5 space-y-1">
                {venue.amenities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <aside className="md:col-span-1 p-4 border rounded-2xl bg-white space-y-3">
          {venue?.price ? (
            <p className="text-2xl">
              <span className="font-bold">${venue.price}</span>{" "}
              <span className="text-gray-600 text-base">/ night</span>
            </p>
          ) : null}
          <button
            type="button"
            disabled
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold disabled:opacity-60"
            onClick={() => console.log("🧪 Book click (disabled, needs auth)")}
          >
            Book (coming soon)
          </button>
          <p className="text-xs text-gray-500">
            Booking requires login. We’ll enable this after auth.
          </p>
        </aside>
      </section>
    </div>
  );
}
