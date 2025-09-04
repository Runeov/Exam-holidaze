/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/noRedundantRoles: <explanation> */
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
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
  const seenIds = useRef(new Set());
  const PAGE_LIMIT = 100;

  // Stable identity for keys/dedupe even if backend id varies
  const identityKey = (v) =>
    v?.id ??
    v?._id ??
    v?.uuid ??
    `${v?.name || "unknown"}|${v?.location?.city || ""}|${v?.location?.country || ""}`;

  const appendUnique = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    const fresh = [];
    for (const v of incoming) {
      const k = String(identityKey(v));
      if (seenIds.current.has(k)) continue;
      seenIds.current.add(k);
      fresh.push(v);
    }
    if (fresh.length) setVenues((prev) => [...prev, ...fresh]);
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
      appendUnique(data);

      lastFetchedPage.current = Math.max(lastFetchedPage.current, pageToFetch);
      setPage(pageToFetch);

      if (data.length < PAGE_LIMIT) setHasMorePages(false);
    } catch (err) {
      if (err?.name !== "AbortError") console.error("listVenues failed", err);
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
      if (err?.name !== "AbortError") console.error("listVenues failed", err);
      setHasMorePages(false);
    } finally {
      isDraining.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
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

  const normalizeUrl = (u) => {
    if (!u) return "";
    let s = String(u).trim();
    if (s.startsWith("//")) s = "https:" + s;
    if (
      typeof window !== "undefined" &&
      window.location?.protocol === "https:" &&
      s.startsWith("http:")
    ) {
      s = s.replace(/^http:/i, "https:");
    }
    return s;
  };

  const pickImageUrl = (v) => {
    const m = firstGoodMedia(v) || {};
    const candidate =
      m.url ?? m.src ?? m.image ?? m.secure_url ?? v?.coverUrl ?? v?.media?.[0]?.url ?? "";
    if (candidate && !/^https?:\/\//i.test(candidate) && !candidate.startsWith("//")) {
      return candidate; // allow relative
    }
    return normalizeUrl(candidate);
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

    // Ensure uniqueness even after filtering
    const seen = new Set();
    const uniq = [];
    for (const v of matched) {
      const k = String(identityKey(v));
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(v);
    }

    // console.log(`[Discover] Matched venues for "${selectedPlace}":`, uniq.length, uniq);
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

          {/* Discover section (Airbnb-style horizontal row) */}
          {selectedPlace && (
            <section
              id="discover-section"
              key={selectedPlace}
              className="mt-8 text-left transition-opacity duration-300"
              aria-busy={loading}
            >
              <h3 className="mb-3 text-xl md:text-2xl font-semibold text-black">
                Discover {selectedPlace}
              </h3>

              {discoverMatches.length === 0 ? (
                <p className="text-text-muted">No venues found for "{selectedPlace}".</p>
              ) : (
                <div className="relative -mx-4 px-4">
                  {/* edge fade masks */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />

                  <ul
                    className="
                      hs-viewport flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth
                      snap-x snap-mandatory
                      [scrollbar-width:none] [-ms-overflow-style:none]
                    "
                    role="list"
                  >
                    {/* hide scrollbar on webkit */}
                    <style>{`.hs-viewport::-webkit-scrollbar { display: none; }`}</style>

                    {discoverMatches.map((v, i) => {
                      const media = firstGoodMedia(v);
                      const locLabel = labelForLocation(v);
                      const info = generatePlaceInfo(locLabel);
                      const key = String(identityKey(v)); // stable, unique across pages
                      return (
                        <li
                          key={key || `fallback-${i}`}
                          className="snap-start shrink-0 w-[16rem] md:w-[18rem]"
                        >
                          <Link
                            to={`/venues/${v.id ?? v._id ?? v.uuid ?? ""}`}
                            aria-label={`Open details for ${v.name || locLabel || "venue"}`}
                            className="block rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                          >
                            <div className="p-3 flex flex-col gap-3">
                              <div className="rounded-lg overflow-hidden bg-muted h-36">
                                {(() => {
                                  const src = pickImageUrl(v);
                                  if (!src) {
                                    return (
                                      <div className="w-full h-full bg-gray-200 grid place-items-center text-xs text-gray-500">
                                        No image
                                      </div>
                                    );
                                  }
                                  return (
                                    <>
                                      <SmartImage
                                        src={src}
                                        url={src}
                                        alt={media?.alt || v.name || locLabel || "Location"}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                          try {
                                            e.currentTarget.src =
                                              "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
                                          } catch {}
                                        }}
                                      />
                                      <noscript>
                                        <img
                                          src={src}
                                          alt={media?.alt || v.name || locLabel || "Location"}
                                          className="h-full w-full object-cover"
                                        />
                                      </noscript>
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm text-white font-semibold line-clamp-1">
                                  {v.location?.city}, {v.location?.country}
                                </p>
                                <p className="text-xs text-text-muted line-clamp-2 mb-1">
                                  {v.name}
                                </p>

                                {/* Price + Rating row */}
                                <div className="flex justify-between items-center text-[11px] text-text">
                                  <span className="font-medium">
                                    ${v.price} <span className="text-text-muted">/ night</span>
                                  </span>
                                  {v.rating > 0 && (
                                    <span className="flex items-center gap-1">
                                      ⭐ {v.rating.toFixed(1)}
                                      <span className="text-text-muted">
                                        ({v.bookings?.length || 0})
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
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
