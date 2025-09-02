/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { useEffect, useRef, useState } from "react";
import SmartImage from "./SmartImage";

export default function MediaCarousel({
  images = [],
  progressive = false,
  initial = 6,
  step = 6,
  afterIdle = 6,
  onReachCount, // (count:number, cause: 'init'|'idle'|'io'|'passive') => void
  onShowMore, // NEW: (location:string) => void
}) {
  const scroller = useRef(null);
  const sentinel = useRef(null);
  const causeRef = useRef("init");
  const [visible, setVisible] = useState(
    progressive ? Math.min(initial, images.length) : images.length,
  );

  const scrollBy = (dx) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  // Clamp visible if images change
  useEffect(() => {
    setVisible((v) =>
      Math.min(v, images.length, progressive ? Math.max(initial, v) : images.length),
    );
  }, [images.length, progressive, initial]);

  // After page settles, load a few more (idle)
  useEffect(() => {
    if (!progressive || afterIdle <= 0) return;
    const cb = () => {
      causeRef.current = "idle";
      setVisible((v) => Math.min(v + afterIdle, images.length));
    };
    const idler =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(cb)
        : setTimeout(cb, 300);
    return () => {
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idler);
      } else {
        clearTimeout(idler);
      }
    };
  }, [progressive, afterIdle, images.length]);

  // Increment when the user scrolls toward the end (IntersectionObserver)
  useEffect(() => {
    if (!progressive || !sentinel.current) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            causeRef.current = "io";
            setVisible((v) => Math.min(v + step, images.length));
          }
        }
      },
      { root: scroller.current, threshold: 0.6 },
    );

    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [progressive, step, images.length]);

  // Notify parent with cause
  useEffect(() => {
    if (typeof onReachCount === "function") {
      onReachCount(visible, causeRef.current);
      causeRef.current = "passive";
    }
  }, [visible, onReachCount]);

  if (!images.length) {
    return (
      <div className="aspect-[16/10] rounded-xl bg-muted grid place-items-center text-text-muted">
        No images
      </div>
    );
  }

  const shown = images.slice(0, visible);

  return (
    <div className="relative">
      <div
        ref={scroller}
        id="hero-scroller"
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {shown.map((m, i) => (
          <div key={i} className="shrink-0 snap-start first:pl-0 last:pr-0">
            <div className="relative aspect-[16/10] w-[min(90vw,860px)] rounded-xl overflow-hidden bg-muted">
              <SmartImage
                url={m.url}
                alt={m.alt || `Image ${i + 1}`}
                className="h-full w-full object-cover"
                eager={i < 2}
                decoding="async"
              />

              {(m.name || m.location) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/60 to-transparent space-y-1">
                  {/* MOVE location up & add CTA on the same row */}
                  {m.location && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white/90 text-xs md:text-sm font-medium line-clamp-1">
                        {m.location}
                      </p>
                      <button
                        type="button"
                        className="pointer-events-auto inline-flex items-center rounded-full bg-white/90 hover:bg-white px-3 py-1 text-xs md:text-sm font-medium text-gray-900 shadow-sm"
                        onClick={() => onShowMore?.(m.location)}
                        aria-label={`Show more about ${m.location}`}
                      >
                        Show more
                      </button>
                    </div>
                  )}

                  {/* Venue name beneath */}
                  {m.name && (
                    <p className="text-white text-sm md:text-base font-semibold line-clamp-1">
                      {m.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Sentinel to trigger loading more when near the end */}
        {progressive && visible < images.length && (
          <div ref={sentinel} className="shrink-0 w-px h-px" aria-hidden="true" />
        )}
      </div>

      {/* Prev/Next */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <button
          type="button"
          aria-label="Previous"
          aria-controls="hero-scroller"
          onClick={() => scrollBy(-400)}
          className="pointer-events-auto rounded-full bg-surface/80 p-2 shadow-sm ring-1 ring-black/10 hover:bg-surface"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next"
          aria-controls="hero-scroller"
          onClick={() => scrollBy(400)}
          className="pointer-events-auto rounded-full bg-surface/80 p-2 shadow-sm ring-1 ring-black/10 hover:bg-surface"
        >
          ›
        </button>
      </div>
    </div>
  );
}
