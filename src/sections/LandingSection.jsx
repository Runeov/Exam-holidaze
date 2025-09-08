// src/sections/LandingSection.jsx
import React, { useMemo } from "react";
import MediaCarousel from "../components/MediaCarousel";
import FilterPanelCard from "../components/FilterPanelCard";

/**
 * LandingSection
 * Renders the hero carousel and a filter panel card beneath it.
 *
 * Controlled by parent (recommended):
 * - Parent owns all filter state to keep data flow consistent across pages.
 *
 * Props:
 * @param {Array<string|{src?:string,url?:string,image?:string,alt?:string,name?:string,location?:string,subLocation?:string}>} slides
 * @param {boolean} calendarOpen
 * @param {(open:boolean)=>void} setCalendarOpen
 * @param {object} selectedDateRange
 * @param {(r:object)=>void} setSelectedDateRange
 * @param {object} tempDateRange
 * @param {(r:object)=>void} setTempDateRange
 * @param {{min:number,max:number}} priceRange
 * @param {(p:{min:number,max:number})=>void} setPriceRange
 * @param {{wifi:boolean,parking:boolean,breakfast:boolean,pets:boolean}} metaFilters
 * @param {(m:object)=>void} setMetaFilters
 * @param {string} selectedPlace
 * @param {(s:string)=>void} setSelectedPlace
 * @param {(n:number,cause:'io'|'manual'|'idle')=>void} [onReachCount]
 */
export default function LandingSection({
  slides = [],
  calendarOpen,
  setCalendarOpen,
  selectedDateRange,
  setSelectedDateRange,
  tempDateRange,
  setTempDateRange,
  priceRange,
  setPriceRange,
  metaFilters,
  setMetaFilters,
  selectedPlace,
  setSelectedPlace,
  onReachCount,
}) {
  // Normalize whatever the parent passes into { src, alt, location, name, subLocation }
  const normSlides = useMemo(() => {
    const arr = Array.isArray(slides) ? slides : [];
    return arr
      .map((m) => {
        if (!m) return null;
        if (typeof m === "string") return { src: m, alt: "" };
        const src = m.src || m.url || m.image || m?.media?.src || m?.media?.url;
        if (!src) return null;
        return {
          src,
          alt: m.alt || m.title || m.caption || "",
          name: m.name || "",
          location: m.location || "",
          subLocation: m.subLocation || "",
        };
      })
      .filter(Boolean);
  }, [slides]);

  // When user clicks "Show more" on a slide: feed location and open the panel
  function handleShowMore(location) {
    if (typeof location === "string" && location.trim()) {
      setSelectedPlace?.(location.trim());
    }
    setCalendarOpen?.(true);
  }

  return (
    <section className="max-w-5xl mx-auto">
      {/* Carousel */}
      {normSlides.length > 0 ? (
        <MediaCarousel
          images={normSlides.map((s) => ({
            url: s.src,
            alt: s.alt,
            name: s.name,
            location: s.location,
            subLocation: s.subLocation,
          }))}
          progressive
          initial={6}
          step={6}
          afterIdle={6}
          onReachCount={onReachCount}
          onShowMore={handleShowMore}
        />
      ) : (
        <div className="aspect-[16/9] w-full rounded-xl border border-black/10 bg-black/5 grid place-items-center">
          <p className="text-sm text-gray-600">No slides to show</p>
        </div>
      )}

      {/* Filter panel card directly under the carousel */}
      <div className="px-4 sm:px-6 mt-6">
        <div className="relative -mt-16 z-10 flex w-full items-center justify-center">
          <FilterPanelCard
            open={!!calendarOpen}
            onClose={() => setCalendarOpen?.(false)}
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
            className="absolute top-full left-1/2 mt-2 w-full max-w-lg -translate-x-1/2"
          />
        </div>
      </div>
    </section>
  );
}
