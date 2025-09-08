// filepath: src/sections/VenuesSections.jsx
// purpose: Your VenuesSections with location normalization (string or object),
//          safe date labels, and stable dedupe even if identityKey isn't provided.

import React, { forwardRef, useId } from "react";
import { Link } from "react-router-dom";
import { hasBookingConflict } from "../utils/dates";
import { firstGoodMedia, labelForLocation } from "../utils/media";
import SmartImage from "./SmartImage";


function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefers(mql.matches);
    setPrefers(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);
  return prefers;
}

function Defer({ delay = 0, children }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(delay === 0 || prefersReducedMotion);
  useEffect(() => {
    if (prefersReducedMotion || delay === 0) {
      setReady(true);
      return;
    }
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay, prefersReducedMotion]);
  return ready ? children : null;
}
// ——— helpers live OUTSIDE the component (so they don't get re-created every render)
function normalizeLocation(loc) {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  const { address, city, region, state, zip, country } = loc || {};
  return [address, city, region ?? state, zip, country]
    .map((x) => (x ?? "").toString().trim())
    .filter(Boolean)
    .join(", ");
}
function toSearch(v) {
  return String(v ?? "").toLowerCase().trim();
}
function fmtDate(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt instanceof Date && !Number.isNaN(+dt) ? dt.toDateString() : "";
}
function getId(x, identityKey) {
  if (typeof identityKey === "function") return identityKey(x);
  return x?.id ?? x?._id ?? x?.uuid ?? x?.slug ?? x?.name ?? "";
}
function handleShowMore(location) {
  if (location) {
    setSelectedPlace(location);   // feeds the searchbar/filter
  }
  setCalendarOpen(true);          // opens the filter card
}

const VenuesSections = forwardRef(function VenuesSections(
  {
    venues = [],
    selectedPlace,
    selectedDateRange,
    loading,
    identityKey,
    pickImageUrl,
    priceRange,
    metaFilters,
  },
  availableRef,
) {
  const unavailableId = useId();
  const recommendedId = useId();

  // key fix: support string OR object for selectedPlace
  const targetPlaceRaw =
    typeof selectedPlace === "string" ? selectedPlace : normalizeLocation(selectedPlace);
  const targetPlace = toSearch(targetPlaceRaw);

  const filteredByLocation = venues.filter((v) => {
    const fields = [
      v?.name,
      v?.location?.address,
      v?.location?.city,
      v?.location?.region ?? v?.location?.state,
      v?.location?.zip,
      v?.location?.country,
    ].filter(Boolean);
    return targetPlace ? fields.some((f) => toSearch(f).includes(targetPlace)) : true;
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
    const shownKeys = new Set(availableVenues.map((v) => String(getId(v, identityKey))));
    recommendedVenues = venues
      .filter(
        (v) =>
          !hasBookingConflict(v.bookings, selectedDateRange.from, selectedDateRange.to) &&
          !shownKeys.has(String(getId(v, identityKey))),
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
          const venueKey = `${getId(v, identityKey)}-${keySuffix}${i}`;

          return (
            <li
              key={venueKey}
              className={`snap-start shrink-0 w-[17rem] md:w-[19rem] transition transform hover:scale-[1.015] ${unavailable ? "opacity-50 pointer-events-none grayscale" : ""}`}
            >
              <Link
                to={`/venues/${getId(v, identityKey)}`}
                aria-label={`Open details for ${v.name || locLabel || "venue"}`}
                className="block rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <div className="block rounded-xl border border-[var(--color-muted)] bg-white shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 transition">
                  <div className="rounded-lg overflow-hidden bg-[var(--color-muted)] h-36">
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
                    <div className="flex justify-between items-center text-[11px] text-[var(--color-text)]">
                      <span className="font-medium">
                        ${v.price} <span className="text-[var(--color-text-muted)]">/ night</span>
                      </span>
                      {v.rating > 0 && (
                        <span className="flex items-center gap-1">
                          ⭐ {v.rating.toFixed(1)}
                          <span className="text-[var(--color-text-muted)]">
                            ({v.bookings?.length || 0})
                          </span>
                        </span>
                      )}
                    </div>
                    {!unavailable && (
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          className="mt-2 rounded-full px-4 py-1.5 text-sm font-medium text-star-twinkle bg-[var(--color-holidaze-card-500)] hover:bg-[var(--color-brand-100)] active:scale-95 transition"
                          onClick={() => {
                            console.log("Booking for:", v.name);
                          }}
                        >
                          Book now
                        </button>
                      </div>
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

  const displayPlace = normalizeLocation(selectedPlace);

  return (
    <>
      {/* ✅ Available Section */}
      <section
        ref={availableRef}
        className="mt-8 text-left transition-opacity duration-300"
        aria-busy={loading}
      >
        <h3 className="mb-3 text-xl md:text-2xl font-semibold text-[color:var(--color-text-bright-muted)]">
          {displayPlace ? `Available in ${displayPlace}` : `Available Venues`}
          {selectedDateRange?.from && selectedDateRange?.to && (
            <>
              {" "}
              ({fmtDate(selectedDateRange.from)} – {fmtDate(selectedDateRange.to)})
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
          <h3 className="mb-3 text-xl md:text-2xl font-semibold text-[color:var(--color-text-bright-muted)]">
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
          <h3 className="mb-3 text-xl md:text-2xl font-semibold text-[color:var(--color-brand-50)]">
            Available Venues
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