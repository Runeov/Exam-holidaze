/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listVenues } from "../api/venues";
import CalendarDropdown from "../components/CalendarDropdown";
import DiscoverMoreButton from "../components/DiscoverMoreButton";
import FilterBadge from "../components/FilterBadge";
import LiveTravelTips from "../components/LiveTravelTips";
import MediaCarousel from "../components/MediaCarousel";
import SmartImage from "../components/SmartImage";
import VenuesSections from "../components/VenuesSections";
import { hasBookingConflict } from "../utils/dates";
import { firstGoodMedia, generatePlaceInfo, hasGoodMedia, labelForLocation } from "../utils/media";
import LandingSection from "../sections/LandingSection";
import FilterPanelCard from "../components/FilterPanelCard";


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
  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
  const [metaFilters, setMetaFilters] = useState({
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calWrapRef = useRef(null);
  const datesBtnRef = useRef(null);
const [showFilters, setShowFilters] = useState(false);
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
    if (!calendarOpen) return;
    function onDocClick(e) {
      if (!calWrapRef.current) return;
      if (!calWrapRef.current.contains(e.target) && !datesBtnRef.current?.contains(e.target)) {
        setCalendarOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setCalendarOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [calendarOpen]);

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



// If you don't already have this:
const toPlaceToken = (x) => {
  const raw = typeof x === "string" ? x : x?.name ?? "";
  return String(raw).trim().toLowerCase();
};

function handleShowMore(loc) {
  // 1) Normalize & guard
  const target = toPlaceToken(loc);
  if (!target) return;

  // 2) Feed the searchbar/filter state first (avoids stale reads during drain)
  setSelectedPlace(target);

  // 3) Open the calendar (as in your snippet). 
  //    If you instead want the filter panel, call setFiltersOpen(true) and setCalendarOpen(false).
  setCalendarOpen(true);

  // 4) Drain remaining pages; pass the place if the function supports it
  if (hasMorePages && !isDraining.current && typeof fetchAllRemaining === "function") {
    // Support both signatures: fetchAllRemaining({ place }) or fetchAllRemaining()
    const maybePromise =
      fetchAllRemaining.length > 0
        ? fetchAllRemaining({ place: target })
        : fetchAllRemaining();
    void maybePromise; // fire-and-forget
  }
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
      return candidate;
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
    <section className="relative bg-brand-50 rounded-xl shadow-sm mb-12 flex items-start">
      <div className="w-full text-center pt-4 md:pt-8 pb-12 space-y-0 px-0 sm:px-0 md:px-0 lg:px-[var(--page-gutter-wide)]">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-star-twinkle">
          Holidaze
        </h1>
        <div className="space-y-0">
          <h2 className="mx-auto w-full max-w-md text-center text-lg md:text-xl font-semibold text-white/80">
            Wander Freely, Travel Boldly
          </h2>
        </div>
      </div>
    </section>

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
        onShowMore={(loc) => {
          if (typeof loc === "string" && loc.trim()) setSelectedPlace(loc.trim());
          setCalendarOpen(true);
        }}
      />
    </div>

    <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 -mt-16 relative z-10">
        <div className="relative flex w-full items-center justify-center gap-3">
          {/* Filter panel card (replaces inline CalendarDropdown) */}
          <FilterPanelCard
            open={calendarOpen}
            onClose={() => setCalendarOpen(false)}
            selectedDateRange={selectedDateRange}
            setSelectedDateRange={setSelectedDateRange}
            tempDateRange={tempDateRange}
            setTempDateRange={setTempDateRange}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            metaFilters={metaFilters}
            setMetaFilters={setMetaFilters}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            className="absolute top-full left-1/2 z-20 mt-2 w-full max-w-lg -translate-x-1/2"
          />
        </div>
      </div>
    </div>

    {/* ▼ badges + venues section follows here */}
    {(selectedPlace || (selectedDateRange?.from && selectedDateRange?.to)) && (
      <>
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

    <section className="max-w-5xl mx-auto w-full mt-12">
      <div className="rounded-2xl bg-white shadow-sm border border-black/10 p-6 md:p-8 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-700 text-center">
          Travel guidance for your trip
        </h1>
        <p className="text-text-muted text-center max-w-2xl mx-auto">
          Helpful; insights; and; recommendations; tailored; to; your; destination.
        </p>
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          <div className="rounded-2xl bg-white shadow-sm border border-black/5 p-6 md:p-8 text-left">
            <h2 className="text-lg md:text-xl font-semibold text-brand-700 mb-3">
              {`Travel tips ${selectedPlace ? `for ${selectedPlace}` : ""}`}
            </h2>
            <div className="text-text-muted leading-relaxed">
              <LiveTravelTips location={selectedPlace || "Spain"} />
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
);}