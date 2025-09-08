import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "./SmartImage";

/**
 * MediaCarousel
 *
 * Props:
 * - images: Array<{ url: string, alt?: string, name?: string, location?: string, subLocation?: string }>
 * - progressive?: boolean
 * - initial?: number           // how many to show initially
 * - step?: number              // how many to add per "show more" / intersection
 * - afterIdle?: number         // optional idle-load batch size
 * - onReachCount?: (count:number, cause:'io'|'manual'|'idle') => void
 * - onShowMore?: (location?: string) => void   // <-- will be called with slide.location
 */
export default function MediaCarousel({
  images = [],
  progressive = true,
  initial = 6,
  step = 6,
  afterIdle = 6,
  onReachCount,
  onShowMore,
}) {
  const scroller = useRef(null);
  const ioRef = useRef(null);

  // Normalize slides minimally to ensure we have url + alt
  const slides = useMemo(
    () =>
      (Array.isArray(images) ? images : [])
        .map((m) => {
          if (!m) return null;
          if (typeof m === "string") return { url: m, alt: "" };
          const url = m.url || m.src || m.image || (m.media && (m.media.url || m.media.src));
          if (!url) return null;
          return {
            url,
            alt: m.alt || m.title || m.caption || "",
            name: m.name || "",
            location: m.location || "",
            subLocation: m.subLocation || "",
          };
        })
        .filter(Boolean),
    [images],
  );

  const [count, setCount] = useState(progressive ? Math.min(initial, slides.length) : slides.length);

  useEffect(() => {
    // Reset count if images change
    setCount(progressive ? Math.min(initial, slides.length) : slides.length);
  }, [slides.length, progressive, initial]);

  // Intersection Observer to progressively reveal more cards as user scrolls horizontally
  useEffect(() => {
    if (!progressive || !scroller.current) return;

    const node = scroller.current;
    const sentinels = node.querySelectorAll("[data-carousel-sentinel]");
    const opts = { root: node, threshold: 0.75 };

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setCount((c) => {
            const next = Math.min(c + step, slides.length);
            if (typeof onReachCount === "function" && next !== c) {
              onReachCount(next, "io");
            }
            return next;
          });
        }
      }
    }, opts);

    sentinels.forEach((el) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
  }, [progressive, slides.length, step, onReachCount]);

  // Optional idle loading (after a brief delay)
  useEffect(() => {
    if (!progressive || !afterIdle) return;
    const t = setTimeout(() => {
      setCount((c) => {
        const next = Math.min(c + afterIdle, slides.length);
        if (typeof onReachCount === "function" && next !== c) {
          onReachCount(next, "idle");
        }
        return next;
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [progressive, afterIdle, slides.length, onReachCount]);

  const shown = slides.slice(0, count);

  return (
    <div className="relative">
      <div
        ref={scroller}
        id="hero-scroller"
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {shown.map((m, i) => (
          <div key={i} className="shrink-0 snap-start first:pl-0 last:pr-0">
            <div className="relative aspect-[16/10] w-[min(90vw,860px)] rounded-xl overflow-hidden bg-muted translate-x-10 md:translate-x-16 lg:translate-x-22">
              <SmartImage
                url={m.url}
                alt={m.alt || `Image ${i + 1}`}
                className="h-full w-full object-cover object-center sm:object-[65%] md:object-[70%] lg:object-[75%]"
                eager={i < 2}
                decoding="async"
              />

              {(m.name || m.location) && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

                  {m.location && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                      <p className="px-4 py-2 rounded-full text-white text-base md:text-lg font-semibold tracking-tight bg-black/35 backdrop-blur-md ring-1 ring-white/20 shadow-lg">
                        {m.location}
                      </p>
                      {m.subLocation && (
                        <p className="mt-1 text-center text-white/80 text-xs md:text-sm font-medium bg-black/25 inline-block px-3 py-1 rounded-full backdrop-blur-md ring-1 ring-white/10">
                          {m.subLocation}
                        </p>
                      )}
                    </div>
                  )}

                  {m.location && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base md:text-lg font-semibold 
                                   rounded-full shadow-lg transition-all duration-300 ease-out
                                   bg-[color:var(--color-brand-600)] text-white border border-white/40
                                   hover:bg-[color:var(--color-brand-700)] hover:scale-105 hover:shadow-xl hover:border-white/60
                                   active:scale-95 focus:outline-none focus-visible:ring-4 
                                   focus-visible:ring-[color:var(--color-brand-500)] focus-visible:ring-offset-2 
                                   focus-visible:ring-offset-black/20 animate-pulse"
                        onClick={() => {
                          // 🔄 pass the location up to parent; parent will setSelectedPlace + open filters
                          onShowMore?.(m.location);
                        }}
                        aria-label={`Show more about ${m.location}`}
                      >
                        Show more ✨
                      </button>
                    </div>
                  )}

                  {m.name && (
                    <p className="absolute bottom-4 right-4 z-10 text-base md:text-lg font-semibold tracking-tight text-white bg-black/35 px-3 py-1 rounded-md backdrop-blur-md ring-1 ring-white/15 pointer-events-none">
                      {m.name}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* sentinel to trigger IO loads when user scrolls near end */}
        {progressive && count < slides.length && (
          <div
            data-carousel-sentinel
            aria-hidden="true"
            className="shrink-0 snap-start w-6"
          />
        )}
      </div>
    </div>
  );
}