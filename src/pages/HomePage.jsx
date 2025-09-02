import React, { useEffect, useMemo, useState } from "react";
import { listVenues } from "../api/venues";
import FeaturedVenues from "../components/FeaturedVenues";
import MediaCarousel from "../components/MediaCarousel";
import SearchBar from "../components/SearchBar";
import SmartImage from "../components/SmartImage";
import VenueCard from "../components/VenueCard";

/* ---------- stable, module-scope helpers ---------- */
const IMAGE_EXT_RE = /\.(avif|webp|png|jpe?g|gif|svg)$/i;

function isValidImageUrl(s) {
  if (typeof s !== "string") return false;
  const u = s.trim();
  if (!/^https?:\/\//i.test(u)) return false;
  const path = u.split("?")[0].toLowerCase();
  return IMAGE_EXT_RE.test(path);
}
function hasGoodMedia(v) {
  return Array.isArray(v?.media) && v.media.some((m) => m?.url && isValidImageUrl(m.url));
}
function firstGoodMedia(v) {
  if (!Array.isArray(v?.media)) return undefined;
  return v.media.find((m) => m?.url && isValidImageUrl(m.url));
}
function labelForLocation(v) {
  const city = v?.location?.city;
  const country = v?.location?.country;
  return [city, country].filter(Boolean).join(", ") || v?.location?.address || "";
}
// tiny deterministic hash so “generated” numbers are stable per location string
function hashInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function currencyFor(country = "") {
  const map = {
    Norway: "NOK",
    Sweden: "SEK",
    Finland: "EUR",
    Denmark: "DKK",
    Iceland: "ISK",
    "United Kingdom": "GBP",
    UK: "GBP",
    Ireland: "EUR",
    Germany: "EUR",
    France: "EUR",
    Spain: "EUR",
    Italy: "EUR",
    Portugal: "EUR",
    Netherlands: "EUR",
    Belgium: "EUR",
    Greece: "EUR",
    Romania: "RON",
    Poland: "PLN",
    USA: "USD",
    "United States": "USD",
  };
  return map[country] || "local currency";
}
function parseCityCountry(label = "") {
  const [c, k] = label.split(",").map((s) => s.trim());
  return { city: k ? c : c, country: k || "" };
}
function generatePlaceInfo(label) {
  const { city, country } = parseCityCountry(label);
  const h = hashInt(label);
  const inhabitants = Math.round(80_000 + (h % 2_420_000)); // synthetic
  const tMin = (h % 12) - 2;
  const tMax = tMin + 12 + ((h >> 3) % 8);
  const curr = currencyFor(country);
  const blurb =
    city || country
      ? `Auto-generated overview for ${city ? city : country}. A great base for food, culture, and outdoor experiences.`
      : "Auto-generated overview. Explore local highlights, cuisine, and nature spots.";
  return {
    inhabitants,
    country: country || "—",
    currency: curr,
    temperature: `${tMin}–${tMax}°C`,
    blurb,
  };
}
/* ----------------------------------------------- */

export default function HomePage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await listVenues(
          {
            page: 1,
            limit: 60,
            sort: "rating",
            order: "desc",
            withOwner: false,
            signal: ac.signal,
          },
          undefined,
        );
        setVenues(res?.data?.data ?? []);
      } catch (err) {
        if (err?.name !== "AbortError") console.error("listVenues failed", err);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Featured: only venues with valid media and decent rating
  const featured = useMemo(
    () => venues.filter((v) => hasGoodMedia(v) && (v?.rating ?? 0) >= 4).slice(0, 6),
    [venues],
  );

  // Slides for hero (prefer featured-with-media, then rest-with-media)
  const heroSlides = useMemo(() => {
    const toSlide = (v, i) => {
      const m = firstGoodMedia(v);
      const locationLabel = labelForLocation(v);
      return {
        url: m.url,
        alt: m.alt || v.name || `Hero ${i + 1}`,
        name: v.name,
        location: locationLabel,
      };
    };
    const fromFeatured = featured.map(toSlide);
    const more = venues.filter(hasGoodMedia).map(toSlide);
    const seen = new Set();
    const all = [];
    for (const s of [...fromFeatured, ...more]) {
      const key = `${s.url}::${s.name || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(s);
    }
    return all;
  }, [featured, venues]);

  const suggestionLocation = useMemo(() => heroSlides[0]?.location || "", [heroSlides]);

  function handleShowMore(loc) {
    if (!loc) return;
    setSelectedPlace(loc);
  }

  // Hero grid SOURCE list (what we search through)
  const heroSource = useMemo(() => {
    if (selectedPlace) {
      const tgt = selectedPlace.toLowerCase();
      return venues.filter((v) => {
        if (!hasGoodMedia(v)) return false;
        return labelForLocation(v).toLowerCase().includes(tgt);
      });
    }
    return venues.filter(hasGoodMedia);
  }, [selectedPlace, venues]);

  // ONE console.log: what we’re searching through (not the results)
  useEffect(() => {
    console.log(
      "[HeroGrid:source] count:",
      heroSource.length,
      "| locations:",
      heroSource.map((v) => labelForLocation(v)),
    );
  }, [heroSource]);

  // Actual items shown under the search bar
  const heroGrid = useMemo(() => heroSource.slice(0, 8), [heroSource]);

  // a11y keyboard support for the clickable overlay (Enter/Space/Escape)
  const closePrompt = () => setShowPrompt(false);
  const onOverlayKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closePrompt();
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      closePrompt();
    }
  };

  return (
    <main className="space-y-16 pb-16 px-0 sm:px-0 md:px-0 lg:px-[var(--page-gutter-wide)]">
      {/* Hero */}
      <section className="relative bg-brand-50 rounded-xl shadow-sm mb-12 min-h-screen flex items-start">
        <div className="w-full text-center pt-4 md:pt-8 pb-12 space-y-5 px-0 sm:px-0 md:px-0 lg:px-[var(--page-gutter-wide)]">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-700">Find your perfect stay</h1>
          <h2 className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto">
            Browse unique places to stay, discover hidden gems, and book your next adventure with
            Holidaze.
          </h2>

          {/* Media Carousel */}
          <div className="max-w-5xl mx-auto">
            <MediaCarousel
              images={heroSlides}
              progressive
              initial={6}
              step={6}
              afterIdle={6}
              onReachCount={(count, cause) => {
                if (cause === "io" && count >= 12 && !showPrompt) setShowPrompt(true);
              }}
              onShowMore={handleShowMore}
            />
          </div>

          {/* Search (prefilled with selectedPlace) */}
          <div className="max-w-2xl mx-auto">
            <SearchBar initialQuery={selectedPlace} />
          </div>

          {/* Compact info cards under SearchBar (half-size images + generated info) */}
          {heroGrid.length > 0 && (
            <section className="mt-8 text-left">
              <h3 className="mb-3 text-xl md:text-2xl font-semibold text-white">
                {selectedPlace ? `Discover ${selectedPlace}` : "Discover destinations"}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {heroGrid.map((v) => {
                  const media = firstGoodMedia(v);
                  const locLabel = labelForLocation(v);
                  const info = generatePlaceInfo(locLabel);
                  return (
                    <li
                      key={v.id}
                      className="rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md transition"
                    >
                      <div className="p-3 flex items-start gap-3">
                        {/* Half-size thumbnail */}
                        <div className="shrink-0 rounded-lg overflow-hidden bg-muted w-32 h-20 md:w-36 md:h-24">
                          <SmartImage
                            url={media?.url}
                            alt={media?.alt || v.name || locLabel || "Location"}
                            className="h-full w-full object-cover"
                            eager={false}
                            decoding="async"
                          />
                        </div>

                        {/* Auto-generated info */}
                        <div className="min-w-0">
                          <p className="text-sm text-white font-semibold line-clamp-1">
                            {locLabel || "—"}
                          </p>
                          <p className="text-xs text-text-muted line-clamp-2 mb-2">{info.blurb}</p>
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text">
                            <div>
                              <dt className="text-text-muted">Inhabitants</dt>
                              <dd>{info.inhabitants.toLocaleString()}</dd>
                            </div>
                            <div>
                              <dt className="text-text-muted">Country</dt>
                              <dd>{info.country}</dd>
                            </div>
                            <div>
                              <dt className="text-text-muted">Currency</dt>
                              <dd>{info.currency}</dd>
                            </div>
                            <div>
                              <dt className="text-text-muted">Temperature</dt>
                              <dd>{info.temperature}</dd>
                            </div>
                          </dl>
                          <p className="mt-2 text-[11px] text-text-muted">
                            Auto-generated overview
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </section>

      {/* Discover section appears after "Show more" (kept) */}
      {selectedPlace && (
        <section className="rounded-xl border border-black/10 bg-surface p-6 md:p-8 space-y-6">
          <header className="space-y-1 text-left">
            <h3 className="text-2xl md:text-3xl font-semibold text-white">
              Discover {selectedPlace}
            </h3>
            <p className="text-text-muted">
              Highlights, tips, and hand-picked venues in {selectedPlace}. (Content placeholder)
            </p>
          </header>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {venues
              .filter((v) => {
                const lbl = labelForLocation(v).toLowerCase();
                return hasGoodMedia(v) && lbl.includes(selectedPlace.toLowerCase());
              })
              .slice(0, 12)
              .map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
          </ul>
        </section>
      )}

      {/* Featured */}
      {!loading && featured.length > 0 && <FeaturedVenues venues={featured} />}
      {loading && <div className="text-center p-12 text-text-muted">Loading featured venues…</div>}

      {/* Booking suggestion prompt */}
      {showPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Booking suggestions"
          className="fixed inset-0 z-[60] grid place-items-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40"
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
            onClick={closePrompt}
            onKeyDown={onOverlayKeyDown}
          />
          <div className="relative z-[61] w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Do you want to make a booking?
            </h3>
            <p className="text-gray-700 mb-4">
              We can guide you through a quick booking flow.{" "}
              {suggestionLocation && (
                <>
                  Also, explore more venues in{" "}
                  <span className="font-medium underline decoration-gray-300 underline-offset-4">
                    {suggestionLocation}
                  </span>
                  .
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                onClick={closePrompt}
              >
                Not now
              </button>
              <button
                type="button"
                className="rounded-lg bg-brand-700 text-white px-4 py-2 hover:bg-brand-800"
                onClick={closePrompt}
              >
                Start booking
              </button>
              {suggestionLocation && (
                <button
                  type="button"
                  className="rounded-lg bg-surface px-4 py-2 ring-1 ring-black/10 hover:bg-black/[.03]"
                  onClick={closePrompt}
                >
                  More in {suggestionLocation}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
