// src/components/FeaturedVenues.jsx
import { Link } from "react-router-dom";

export default function FeaturedVenues({ venues = [] }) {
  return (
    <section className="space-y-6">
      <header className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-brand-700">Top Rated Venues</h2>
        <p className="text-text-muted text-lg">
          Discover our most loved stays — chosen for their comfort, location, and style.
        </p>
      </header>

      <ul className="grid-venues">
        {venues.map((venue) => {
          const img = venue?.media?.[0];
          return (
            <li
              key={venue.id}
              className="rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md transition"
            >
              <Link to={`/venues/${venue.id}`} className="block">
                <div className="aspect-[16/10] overflow-hidden rounded-t-xl bg-muted">
                  {img?.url ? (
                    <img
                      src={img.url}
                      alt={img.alt || venue.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-text-muted">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-semibold text-text">{venue.name}</h3>
                  <p className="text-sm text-text-muted line-clamp-2">{venue.description}</p>
                  <div className="flex justify-between items-center text-sm text-text">
                    <span>€{venue.price}/night</span>
                    <span>Max {venue.maxGuests} guests</span>
                  </div>
                  <div className="text-sm text-brand-700 font-medium">
                    ⭐ {venue.rating?.toFixed(1) ?? "–"}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
