import { Link } from "react-router-dom";

/**
 * Minimal, DRY venue card. Reuse everywhere.
 * Expects: id, name, description, price, maxGuests, media[]
 */
export default function VenueCard({ venue = {}, priority = false }) {
  // Deconstruct for clarity while debugging
  const { id, name, description, price, maxGuests, media = [] } = venue || {};

  const img = media?.[0];
  const isAboveFold = priority;

  // Debug: render-level visibility (can be noisy if many cards)
  console.debug("[VenueCard] render", { id, name, hasImg: Boolean(img?.url) });

  return (
    <li className="rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md transition">
      <Link
        to={id ? `/venues/${id}` : "#"}
        className="block focus:outline-none focus-visible:ring-2 ring-[--color-brand-500] rounded-lg"
        aria-label={name || "View venue"}
      >
        <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted mb-3">
          {img?.url ? (
            <img
              src={img.url}
              // If your CDN supports width query params, re-add them; keeping simple while debugging
              srcSet={`${img.url} 400w, ${img.url} 800w, ${img.url} 1200w`}
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              alt={img.alt || name || "Venue image"}
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

        <h3 className="font-semibold text-text">{name || "Untitled venue"}</h3>
        {description ? (
          <p className="text-sm text-text-muted line-clamp-2">{description}</p>
        ) : (
          <p className="text-sm text-text-muted">No description</p>
        )}

        <div className="mt-2 text-sm text-text text-bold">
          €{Number.isFinite(price) ? price : 0} · max {maxGuests ?? 0} guests
        </div>
      </Link>
    </li>
  );
}
