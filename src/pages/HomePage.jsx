/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listVenues } from "../api/venues";
import BrandedCalendar from "../components/BrandedCalendar";
import CalendarDropdown from "../components/CalendarDropdown";
import DiscoverMoreButton from "../components/DiscoverMoreButton";
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
  );

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

  // --- Location-aware tips (stable order per location) ---
  const travelTips = useMemo(() => {
    const loc = suggestionLocation || "your destination";
    const base = [
      `Check local holidays in ${loc}—popular venues book out early.`,
      `Sample a neighborhood market in ${loc} to find regional snacks and gifts.`,
      `Public transit in ${loc} can beat traffic—grab a day pass if available.`,
      `Pack layers: weather in ${loc} can change quickly between morning and night.`,
      `Learn a few local phrases—people in ${loc} appreciate the effort.`,
      `Bookmark offline maps for ${loc} in case roaming is spotty.`,
      `Try one lesser-known museum or park in ${loc} to avoid the crowds.`,
      `Look up tipping norms for ${loc} so you’re aligned with local etiquette.`,
      `Plan one “anchor” activity per day in ${loc} and leave room to wander.`,
      `Check if tap water is potable in ${loc} before you buy bottled.`,
    ];
    let seed = 0;
    for (let i = 0; i < loc.length; i++) seed = (seed * 31 + loc.charCodeAt(i)) >>> 0;
    const arr = [...base];
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 6);
  }, [suggestionLocation]);

  const planningNotes = useMemo(
    () => [
      "Compare flexible vs. non-refundable rates—flex can save stress if plans shift.",
      "Filter by amenities you actually use (Wi-Fi, parking, breakfast, pet-friendly).",
      "If your dates are firm, check for mid-week discounts.",
      "Read a few recent reviews to confirm accuracy and responsiveness.",
      "Set your budget range first, then sort by rating to find strong value.",
    ],
    [],
  );

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

          {/* --- Top actions row: Keep the look (card + Discover More on the right) --- */}
          <div className="max-w-5xl mx-auto w-full">
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Card wrapper bearing the "Choose filters" label */}
              <div className="w-full rounded-2xl bg-white border border-black/10 shadow-sm p-6 space-y-4 text-left">
                <h3 className="text-lg md:text-xl font-semibold text-brand-700">Choose filters</h3>
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

              {/* Discover More button on the right */}
              <div className="flex md:justify-end">
                <DiscoverMoreButton />
              </div>
            </div>
          </div>

          {(selectedPlace || (selectedDateRange?.from && selectedDateRange?.to)) && (
            <>
              <div className="max-w-2xl mx-auto mt-4 flex flex-wrap items-center justify-between gap-2">
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
      <section className="max-w-5xl mx-auto w-full mt-12">
        <div className="rounded-2xl bg-white shadow-sm border border-black/10 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Travel Tips - Spain */}
            <div className="rounded-2xl bg-white shadow-sm border border-black/5 p-5 md:p-6 text-left">
              <h3 className="text-xl md:text-2xl font-bold text-brand-700">
                Travel tips for Spain
              </h3>
              <p className="text-text-muted mt-1">
                Quick, practical ideas to make your trip smoother and more fun.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>
                    Sample a neighborhood market in Spain to find regional snacks and gifts.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>Bookmark offline maps for Spain in case roaming is spotty.</span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>Plan one “anchor” activity per day in Spain and leave room to wander.</span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>Learn a few local phrases—people in Spain appreciate the effort.</span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>
                    Look up tipping norms for Spain so you’re aligned with local etiquette.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>Check local holidays in Spain—popular venues book out early.</span>
                </li>
              </ul>
            </div>

            {/* Before you book */}
            <div className="rounded-2xl bg-white shadow-sm border border-black/5 p-5 md:p-6 text-left">
              <h3 className="text-xl md:text-2xl font-bold text-brand-700">Before you book</h3>
              <p className="text-text-muted mt-1">
                A few quick checks to help you pick the right place.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>
                    Compare flexible vs. non-refundable rates—flex can save stress if plans shift.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>
                    Filter by amenities you actually use (Wi-Fi, parking, breakfast, pet-friendly).
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>If your dates are firm, check for mid-week discounts.</span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>Read a few recent reviews to confirm accuracy and responsiveness.</span>
                </li>
                <li className="flex items-start gap-2 text-sm md:text-base">
                  <span className="mt-[2px]">•</span>
                  <span>
                    Set your budget range first, then sort by rating to find strong value.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      ;
    </main>
  );
}
