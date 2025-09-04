/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listVenues } from "../api/venues";
import BrandedCalendar from "../components/BrandedCalendar";
import CalendarDropdown from "../components/CalendarDropdown";
import FilterBadge from "../components/FilterBadge";
import MediaCarousel from "../components/MediaCarousel";
import SearchBar from "../components/SearchBar";
import SmartImage from "../components/SmartImage";
import VenuesSections from "../components/VenuesSections";
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
  const [priceSort, setPriceSort] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 99999 });
  const [metaFilters, setMetaFilters] = useState({
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  });

  const lastFetchedPage = useRef(1);
  const isDraining = useRef(false);
  const seenIds = useRef(new Set());
  const availableRef = useRef(null);

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

  const fetchVenues = useCallback(
    async (pageToFetch = 1) => {
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
    },
    [PAGE_LIMIT],
  ); // any used variables from outer scope

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

  // ✅ useEffect now includes it safely
  useEffect(() => {
    setLoading(true);
    seenIds.current = new Set();
    fetchVenues(1);
  }, [fetchVenues]);

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
        availableRef.current?.scrollIntoView({ behavior: "smooth" });
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
              onApply={(range) => setSelectedDateRange(range)}
              onPriceRangeChange={setPriceRange}
              onMetaFilterChange={setMetaFilters}
              onLocationChange={setSelectedPlace}
              minDate={new Date()}
            />
          </div>
          {/* ✅ VENUE LISTS (Available, Unavailable, Recommended) */}
          {(selectedPlace || (selectedDateRange?.from && selectedDateRange?.to)) && (
            <>
              <div className="max-w-2xl mx-auto mt-4 flex flex-wrap items-center justify-between gap-2">
                {/* Reset Button */}
                <button
                  onClick={() => {
                    setSelectedDateRange(undefined);
                    setTempDateRange(undefined);
                    setPriceRange({ min: 0, max: 99999 });
                    setMetaFilters({
                      wifi: false,
                      parking: false,
                      breakfast: false,
                      pets: false,
                    });
                    setSelectedPlace("");
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Reset All Filters
                </button>

                {/* Active Filter Badges */}
                <div className="flex flex-wrap gap-2 text-sm">
                  {selectedPlace && (
                    <FilterBadge label={selectedPlace} onClear={() => setSelectedPlace("")} />
                  )}
                  {selectedDateRange?.from && selectedDateRange?.to && (
                    <FilterBadge
                      label={`📅 ${selectedDateRange.from.toLocaleDateString()} – ${selectedDateRange.to.toLocaleDateString()}`}
                      onClear={() => {
                        setSelectedDateRange(undefined);
                        setTempDateRange(undefined);
                      }}
                    />
                  )}
                  {(priceRange.min > 0 || priceRange.max < 99999) && (
                    <FilterBadge
                      label={`💰 $${priceRange.min} – $${priceRange.max}`}
                      onClear={() => setPriceRange({ min: 0, max: 99999 })}
                    />
                  )}
                  {Object.entries(metaFilters).map(([key, value]) =>
                    value ? (
                      <FilterBadge
                        key={key}
                        label={`✅ ${key.charAt(0).toUpperCase() + key.slice(1)}`}
                        onClear={() => setMetaFilters((prev) => ({ ...prev, [key]: false }))}
                      />
                    ) : null,
                  )}
                </div>
              </div>

              <VenuesSections
                ref={availableRef}
                venues={venues}
                selectedPlace={selectedPlace}
                selectedDateRange={selectedDateRange}
                loading={loading}
                identityKey={identityKey}
                pickImageUrl={pickImageUrl}
                priceRange={priceRange}
                metaFilters={metaFilters}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
