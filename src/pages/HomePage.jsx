/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/noRedundantRoles: <explanation> */
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listVenues } from "../api/venues";
import BrandedCalendar from "../components/BrandedCalendar";
import CalendarDropdown from "../components/CalendarDropdown";
import MediaCarousel from "../components/MediaCarousel";
import SearchBar from "../components/SearchBar";
import SmartImage from "../components/SmartImage";
import { hasBookingConflict } from "../utils/dates";
import { firstGoodMedia, generatePlaceInfo, hasGoodMedia, labelForLocation } from "../utils/media";

export default function HomePage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [tempDateRange, setTempDateRange] = useState(null);

  const lastFetchedPage = useRef(1);
  const isDraining = useRef(false);
  const seenIds = useRef(new Set());
  const PAGE_LIMIT = 100;

  const identityKey = (v) =>
    v?.id ??
    v?._id ??
    v?.uuid ??
    `${v?.name || "unknown"}|${v?.location?.city || ""}|${v?.location?.country || ""}`;

  const appendVenues = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    setVenues((prev) => [...prev, ...incoming]);
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
      appendVenues(data);
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
        appendVenues(data);
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
        document.getElementById("available-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  }

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
      <section className="relative bg-brand-50 rounded-xl shadow-sm mb-12 min-h-screen flex items-start">
        <div className="w-full text-center pt-4 md:pt-8 pb-12 space-y-5 px-0 sm:px-0 md:px-0 lg:px-[var(--page-gutter-wide)]">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-700">Find your perfect stay</h1>
          <h2 className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto">
            Browse unique places to stay, discover hidden gems, and book your next adventure with
            Holidaze.
          </h2>

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

          <div className="max-w-2xl mx-auto">
            <CalendarDropdown
              selected={tempDateRange}
              onChange={setTempDateRange}
              onApply={(range) => {
                console.log("✅ Final date range applied:", range);
                setSelectedDateRange(range);
              }}
              minDate={new Date()}
            />
          </div>
        </div>
      </section>

      {/* ✅ REPLACE YOUR OLD available-section WITH THIS BLOCK */}
      {(selectedPlace || (selectedDateRange?.from && selectedDateRange?.to)) &&
        (() => {
          const targetPlace = selectedPlace?.trim().toLowerCase() ?? "";

          const filteredByLocation = venues.filter((v) => {
            const fields = [
              v.name,
              v.location?.city,
              v.location?.country,
              v.location?.address,
              v.location?.zip,
            ].filter(Boolean);

            return targetPlace
              ? fields.some((f) => String(f).toLowerCase().includes(targetPlace))
              : true;
          });

          const finalFiltered =
            selectedDateRange?.from && selectedDateRange?.to
              ? filteredByLocation.filter(
                  (v) =>
                    !hasBookingConflict(v.bookings, selectedDateRange.from, selectedDateRange.to),
                )
              : filteredByLocation;

          console.log("🧭 Selected place:", selectedPlace);
          console.log("🧪 Date range selected:", selectedDateRange);
          console.log("📦 Total venues:", venues.length);
          console.log("✅ Filtered available venues:", finalFiltered);

          if (finalFiltered.length === 0) {
            return (
              <section
                id="available-section"
                className="mt-8 text-left transition-opacity duration-300"
                aria-busy={loading}
              >
                <h3 className="mb-3 text-xl md:text-2xl font-semibold text-black">
                  {selectedPlace ? `Available in ${selectedPlace}` : `Available Venues`}
                </h3>
                <p className="text-text-muted">No venues available for current filters.</p>
              </section>
            );
          }

          return (
            <section
              id="available-section"
              className="mt-8 text-left transition-opacity duration-300"
              aria-busy={loading}
            >
              <h3 className="mb-3 text-xl md:text-2xl font-semibold text-black">
                {selectedPlace ? `Available in ${selectedPlace}` : `Available Venues`}
                {selectedDateRange?.from && selectedDateRange?.to && (
                  <>
                    {" "}
                    ({selectedDateRange.from.toDateString()} – {selectedDateRange.to.toDateString()}
                    )
                  </>
                )}
              </h3>

              <div className="relative -mx-4 px-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />

                <ul
                  className="hs-viewport flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]"
                  role="list"
                >
                  <style>{`.hs-viewport::-webkit-scrollbar { display: none; }`}</style>

                  {finalFiltered.map((v, i) => {
                    const media = firstGoodMedia(v);
                    const locLabel = labelForLocation(v);
                    const key = String(identityKey(v));
                    const src = pickImageUrl(v);

                    return (
                      <li
                        key={`${v.id ?? v._id ?? v.uuid ?? identityKey(v)}-${i}`}
                        className="snap-start shrink-0 w-[16rem] md:w-[18rem]"
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
                              <p className="text-sm text-white font-semibold line-clamp-1">
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
                                    <span className="text-text-muted">
                                      ({v.bookings?.length || 0})
                                    </span>
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="mt-2 text-sm font-medium text-brand-600 hover:underline"
                                onClick={() => {
                                  console.log("Booking for:", v.name);
                                }}
                              >
                                Book now
                              </button>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })()}

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
