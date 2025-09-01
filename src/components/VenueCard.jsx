import { Link } from "react-router-dom";

/**
 * Minimal, DRY venue card. Reuse everywhere.
 * Expects a `venue` with: id, name, description, price, maxGuests, location, media[]
 */
export default function VenueCard({ venue, priority = false }) {
  const img = venue?.media?.[0];
  const isAboveFold = priority;

  return (
    <li className="rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md transition">
      <Link
        to={`/venues/${venue.id}`}
        className="block focus:outline-none focus-visible:ring-2 ring-brand-500 rounded-lg"
      >
        <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted mb-3">
          {img?.url ? (
            <img
              src={img.url}
              srcSet={`
                ${img.url}?w=400 400w,
                ${img.url}?w=800 800w,
                ${img.url}?w=1200 1200w
              `}
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              alt={img.alt || venue.name}
              className="h-full w-full object-cover"
              width="800"
              height="500"
              loading={isAboveFold ? "eager" : "lazy"}
              fetchPriority={isAboveFold ? "high" : "auto"}
              decoding="async"
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-text-muted">No image</div>
          )}
        </div>

        <h3 className="font-semibold text-text">{venue?.name}</h3>
        <p className="text-sm text-text-muted line-clamp-2">{venue?.description}</p>

        <div className="mt-2 text-sm text-text">
          €{venue?.price} · max {venue?.maxGuests} guests
        </div>
      </Link>
    </li>
  );
}
