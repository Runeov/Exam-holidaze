import React from "react";
import { Link } from "react-router-dom";

export default function VenueCard({ venue }) {
  const image =
    venue?.media?.[0]?.url ||
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
  const rating = venue?.rating ?? 0;
  const city = venue?.location?.city || "";
  const country = venue?.location?.country || "";

  return (
    <Link
      to={`/venues/${venue.id}`}
      className="group rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={venue?.name || "Venue"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-semibold line-clamp-1">{venue?.name}</h3>
          <span className="text-sm rounded-lg bg-gray-100 px-2 py-1">★ {rating.toFixed(1)}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
          {city}
          {city && country ? ", " : ""}
          {country}
        </p>
        {venue?.price && (
          <p className="text-sm mt-2">
            <span className="font-semibold">${venue.price}</span> / night
          </p>
        )}
      </div>
    </Link>
  );
}
