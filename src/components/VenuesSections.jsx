import React, { forwardRef, useId } from "react";
import { Link } from "react-router-dom";
import { hasBookingConflict } from "../utils/dates";
import { firstGoodMedia, labelForLocation } from "../utils/media";
import SmartImage from "./SmartImage";

const VenuesSections = forwardRef(function VenuesSections(
  {
    venues,
    selectedPlace,
    selectedDateRange,
    loading,
    identityKey,
    pickImageUrl,
    priceRange,
    metaFilters, // ✅ NEW
  },
  availableRef,
) {
  console.log("📦 Raw venues from API", venues);
  const unavailableId = useId();
  const recommendedId = useId();

  const targetPlace = selectedPlace?.trim().toLowerCase() ?? "";

  const filteredByLocation = venues.filter((v) => {
    const fields = [
      v.name,
      v.location?.city,
      v.location?.country,
      v.location?.address,
      v.location?.zip,
    ].filter(Boolean);

    return targetPlace ? fields.some((f) => String(f).toLowerCase().includes(targetPlace)) : true;
  });

  let availableVenues = [];
  const unavailableVenues = [];

  if (selectedDateRange?.from && selectedDateRange?.to) {
    for (const v of filteredByLocation) {
      if (!hasBookingConflict(v.bookings, selectedDateRange.from, selectedDateRange.to)) {
        availableVenues.push(v);
      } else {
        unavailableVenues.push(v);
      }
    }
  } else {
    availableVenues = filteredByLocation;
  }

  // ✅ Filter by price range
  if (priceRange?.min != null && priceRange?.max != null) {
    availableVenues = availableVenues.filter(
      (v) => v.price >= priceRange.min && v.price <= priceRange.max,
    );
  }

  // ✅ Filter by meta checkboxes
  if (metaFilters) {
    for (const [key, isEnabled] of Object.entries(metaFilters)) {
      if (isEnabled) {
        availableVenues = availableVenues.filter((v) => v.meta?.[key] === true);
      }
    }
  }

  let recommendedVenues = [];
  if (selectedDateRange?.from && selectedDateRange?.to) {
    const shownKeys = new Set(availableVenues.map((v) => String(identityKey(v))));
    recommendedVenues = venues
      .filter(
        (v) =>
          !hasBookingConflict(v.bookings, selectedDateRange.from, selectedDateRange.to) &&
          !shownKeys.has(String(identityKey(v))),
      )
      .sort((a, b) => (b?.rating || 0) - (a?.rating || 0))
      .slice(0, 12);
  }

  const renderVenueList = (list, options = {}) => {
    const { unavailable = false, keySuffix = "" } = options;

    return (
      <ul className="hs-viewport flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]">
        <style>{`.hs-viewport::-webkit-scrollbar { display: none; }`}</style>

        {list.map((v, i) => {
          const media = firstGoodMedia(v);
          const locLabel = labelForLocation(v);
          const src = pickImageUrl(v);
          const venueKey = `${v.id ?? v._id ?? v.uuid ?? identityKey(v)}-${keySuffix}${i}`;

          return (
            <li
              key={venueKey}
              className={`snap-start shrink-0 w-[16rem] md:w-[18rem] ${
                unavailable ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <Link
                to={`/venues/${v.id ?? v._id ?? v.uuid ?? ""}`}
                aria-label={`Open details for ${v.name || locLabel || "venue"}`}
                className="block rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <div className="p-3 flex flex-col gap-3">
                  <div className="rounded-lg overflow-hidden bg-muted h-36">
                    {src ? (
                      <SmartImage
                        src={src}
                        url={src}
                        alt={media?.alt || v.name || locLabel || "Location"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 grid place-items-center text-xs text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted font-semibold line-clamp-1">
                      {v.location?.city}, {v.location?.country}
                    </p>
                    <p className="text-xs text-text-muted line-clamp-2 mb-1">{v.name}</p>
                    <div className="flex justify-between items-center text-[11px] text-text">
                      <span className="font-medium">
                        ${v.price} <span className="text-text-muted">/ night</span>
                      </span>
                      {v.rating > 0 && (
                        <span className="flex items-center gap-1">
                          ⭐ {v.rating.toFixed(1)}
                          <span className="text-text-muted">({v.bookings?.length || 0})</span>
                        </span>
                      )}
                    </div>
                    {!unavailable && (
                      <button
                        type="button"
                        className="mt-2 text-sm font-medium text-brand-600 hover:underline"
                        onClick={() => {
                          console.log("Booking for:", v.name);
                        }}
                      >
                        Book now
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* ✅ Available Section */}
      <section
        ref={availableRef}
        className="mt-8 text-left transition-opacity duration-300"
        aria-busy={loading}
      >
        <h3 className="mb-3 text-xl md:text-2xl font-semibold text-black">
          {selectedPlace ? `Available in ${selectedPlace}` : `Available Venues`}
          {selectedDateRange?.from && selectedDateRange?.to && (
            <>
              {" "}
              ({selectedDateRange.from.toDateString()} – {selectedDateRange.to.toDateString()})
            </>
          )}
        </h3>

        {availableVenues.length === 0 ? (
          <p className="text-text-muted">No venues available for current filters.</p>
        ) : (
          <div className="relative -mx-4 px-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
            {renderVenueList(availableVenues)}
          </div>
        )}
      </section>

      {/* ❌ Unavailable Section */}
      {unavailableVenues.length > 0 && (
        <section
          id={unavailableId}
          className="mt-12 text-left transition-opacity duration-300"
          aria-busy={loading}
        >
          <h3 className="mb-3 text-xl md:text-2xl font-semibold text-black">
            Unavailable on your selected dates
          </h3>
          <div className="relative -mx-4 px-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
            {renderVenueList(unavailableVenues, { unavailable: true, keySuffix: "unavail-" })}
          </div>
        </section>
      )}

      {/* ⭐ Recommended Section */}
      {selectedDateRange?.from && selectedDateRange?.to && recommendedVenues.length > 0 && (
        <section
          id={recommendedId}
          className="mt-12 text-left transition-opacity duration-300"
          aria-busy={loading}
        >
          <h3 className="mb-3 text-xl md:text-2xl font-semibold text-black">
            Recommended for your dates (Top rated)
          </h3>
          <div className="relative -mx-4 px-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
            {renderVenueList(recommendedVenues, { keySuffix: "reco-" })}
          </div>
        </section>
      )}
    </>
  );
});

export default VenuesSections;
