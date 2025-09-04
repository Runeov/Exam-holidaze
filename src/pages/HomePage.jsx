import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listVenues } from "../api/venues";
import MediaCarousel from "../components/MediaCarousel";
import SearchBar from "../components/SearchBar";
import SmartImage from "../components/SmartImage";
import { firstGoodMedia, generatePlaceInfo, hasGoodMedia, labelForLocation } from "../utils/media";

export default function HomePage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");

  const lastFetchedPage = useRef(1);
  const isDraining = useRef(false);

  // NEW: track seen IDs to prevent duplicates across pages
  const seenIds = useRef(new Set());

  const PAGE_LIMIT = 100;

  // helper to compute a stable identity when id is missing
  const identityKey = (v) =>
    v?.id ??
    v?._id ??
    v?.uuid ??
    `${v?.name || "unknown"}|${v?.location?.city || ""}|${v?.location?.country || ""}`;

  const appendUnique = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    const fresh = [];
    for (const v of incoming) {
      const key = identityKey(v);
      if (seenIds.current.has(key)) continue;
      seenIds.current.add(key);
      fresh.push(v);
    }
    if (fresh.length) {
      setVenues((prev) => [...prev, ...fresh]);
    }
  };

  const fetchVenues = async (pageToFetch = 1) => {
    try {
      const res = await listVenues({
        page: pageToFetch,
        limit: PAGE_LIMIT,
        sort: "rating",
        order: "desc",
        withOwner: false,
      });

      const data = res?.data?.data ?? [];

      // NEW: only append unique items
      appendUnique(data);

      lastFetchedPage.current = Math.max(lastFetchedPage.current, pageToFetch);
      setPage(pageToFetch);

      if (data.length < PAGE_LIMIT) {
        setHasMorePages(false);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("listVenues failed", err);
      }
      setHasMorePages(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRemaining = async () => {
    if (isDraining.current || !hasMorePages) return;
    isDraining.current = true;
    setLoading(true);

    try {
      let nextPage = (lastFetchedPage.current || 1) + 1;
      let more = true;

      while (more) {
        const res = await listVenues({
          page: nextPage,
          limit: PAGE_LIMIT,
          sort: "rating",
          order: "desc",
          withOwner: false,
        });

        const data = res?.data?.data ?? [];

        // NEW: only append unique items
        appendUnique(data);

        lastFetchedPage.current = nextPage;
        setPage(nextPage);

        if (data.length < PAGE_LIMIT) {
          setHasMorePages(false);
          more = false;
        } else {
          nextPage += 1;
        }
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("listVenues failed", err);
      }
      setHasMorePages(false);
    } finally {
      isDraining.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // reset dedupe set on first mount (optional)
    seenIds.current = new Set();
    fetchVenues(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heroSlides = useMemo(() => {
    const toSlide = (v, i) => {
      const m = firstGoodMedia(v);
      return {
        url: m?.url || "",
        alt: m?.alt || v.name || `Hero ${i + 1}`,
        name: v.name,
        location: v.location?.country || "",
      };
    };
    const withMedia = venues.filter(hasGoodMedia).map(toSlide);
    const seen = new Set();
    const all = [];
    for (const s of withMedia) {
      const key = `${s.url}::${s.name || ""}`;
      if (!s.url || seen.has(key)) continue;
      seen.add(key);
      all.push(s);
    }
    return all;
  }, [venues]);

  const suggestionLocation = useMemo(() => heroSlides[0]?.location || "", [heroSlides]);

  function handleShowMore(loc) {
    if (!loc) return;

    const target = String(loc).trim().toLowerCase();

    if (hasMorePages && !isDraining.current) {
      fetchAllRemaining();
    }

    requestAnimationFrame(() => {
      setSelectedPlace(target);
      setTimeout(() => {
        document.getElementById("discover-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  }

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

  const discoverMatches = useMemo(() => {
    if (!selectedPlace) return [];
    const target = selectedPlace.trim().toLowerCase();

    const fieldsOf = (v) => [
      v.name,
      v.location?.address,
      v.location?.city,
      v.location?.zip,
      v.location?.country,
    ];

    const matched = venues.filter((v) =>
      fieldsOf(v)
        .filter((f) => f !== null && f !== undefined)
        .some((field) => String(field).toLowerCase().includes(target)),
    );

    // OPTIONAL: ensure uniqueness again at render-time (belt & suspenders)
    const seen = new Set();
    const uniq = [];
    for (const v of matched) {
      const key = identityKey(v);
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(v);
    }

    // eslint-disable-next-line no-console
    console.log(`[Discover] Matched venues for "${selectedPlace}":`, uniq.length, uniq);
    return uniq;
  }, [selectedPlace, venues]);

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

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar initialQuery={selectedPlace} />
          </div>

          {/* Discover section */}
          {selectedPlace && (
            <section
              id="discover-section"
              key={selectedPlace}
              className="mt-8 text-left transition-opacity duration-300"
            >
              <h3 className="mb-3 text-xl md:text-2xl font-semibold text-black">
                Discover {selectedPlace}
              </h3>

              {discoverMatches.length === 0 ? (
                <p className="text-text-muted">No venues found for "{selectedPlace}".</p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {discoverMatches.map((v, i) => {
                    const media = firstGoodMedia(v);
                    const locLabel = labelForLocation(v);
                    const info = generatePlaceInfo(locLabel);
                    const key = identityKey(v); // stable, unique across pages
                    return (
                      <li
                        key={key || `fallback-${i}`}
                        className="rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md transition"
                      >
                        <Link
                          to={`/venues/${v.id ?? v._id ?? v.uuid ?? ""}`}
                          aria-label={`Open details for ${v.name || locLabel || "venue"}`}
                          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-xl"
                        >
                          <div className="p-3 flex items-start gap-3">
                            <div className="shrink-0 rounded-lg overflow-hidden bg-muted w-32 h-20 md:w-36 md:h-24">
                              {media?.url ? (
                                <SmartImage
                                  url={media.url}
                                  alt={media.alt || v.name || locLabel || "Location"}
                                  className="h-full w-full object-cover"
                                  eager={false}
                                  decoding="async"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-white font-semibold line-clamp-1">
                                {locLabel || "—"}
                              </p>
                              <p className="text-xs text-text-muted line-clamp-2 mb-2">
                                {info.blurb}
                              </p>
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
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>
      </section>

      {/* Booking Prompt */}
      {showPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Booking suggestions"
          className="fixed inset-0 z-[60] grid place-items-center p-4"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
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
                  onClick={() => {
                    setSelectedPlace(String(suggestionLocation).toLowerCase());
                    closePrompt();
                  }}
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
