/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { useEffect, useRef, useState } from "react";
import StyleGuidePage from "../styles/StyleGuidePage";
import SmartImage from "./SmartImage";

export default function MediaCarousel({
  images = [],
  progressive = false,
  initial = 6,
  step = 6,
  afterIdle = 6,
  onReachCount,
  onShowMore,
}) {
  const scroller = useRef(null);
  const sentinel = useRef(null);
  const causeRef = useRef("init");
  const [visible, setVisible] = useState(
    progressive ? Math.min(initial, images.length) : images.length,
  );

  const scrollBy = (dx) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  useEffect(() => {
    setVisible((v) =>
      Math.min(v, images.length, progressive ? Math.max(initial, v) : images.length),
    );
  }, [images.length, progressive, initial]);

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

  const shown = [];
  const seenLocations = new Set();

  for (let i = 0; i < images.length && shown.length < visible; i++) {
    const image = images[i];
    const location = image.location;

    if (!location) continue;

    if (!seenLocations.has(location)) {
      seenLocations.add(location);
      shown.push(image);
    }
  }

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
                className="h-full w-full object-cover object-center"
                eager={i < 2}
                decoding="async"
              />

              {(m.name || m.location) && (
                <>
                  {/* Location – top center */}
                  {m.location && (
                    <p className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-lg md:text-xl font-semibold tracking-tight text-white leading-snug bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                      {m.location}
                    </p>
                  )}

                  {/* Show More Button – bottom center */}
                  {m.location && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 ring-[--color-accent-500] ring-offset-2 text-lg px-5 py-3 ring-[color:var(--color-brand-500)] bg-[color:var(--color-brand-300)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]"
                        onClick={() => {
                          console.debug("[MediaCarousel] Show more clicked", {
                            location: m.location,
                          });
                          onShowMore?.(m.location);
                        }}
                        aria-label={`Show more about ${m.location}`}
                      >
                        Show more
                      </button>
                    </div>
                  )}

                  {/* Name – bottom right corner */}
                  {m.name && (
                    <p className="absolute bottom-4 right-4 z-10 text-base md:text-lg font-semibold tracking-tight leading-snug text-white bg-black/50 px-3 py-1 rounded-md backdrop-blur-md pointer-events-none">
                      {m.name}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {progressive && visible < images.length && (
          <div ref={sentinel} className="shrink-0 w-px h-px" aria-hidden="true" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <button
          type="button"
          aria-label="Previous"
          aria-controls="hero-scroller"
          onClick={() => scrollBy(-400)}
          className="pointer-events-auto rounded-full bg-surface/80 p-2 ring-1 ring-black/10 hover:bg-surface text-lg font-bold"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next"
          aria-controls="hero-scroller"
          onClick={() => scrollBy(400)}
          className="pointer-events-auto rounded-full bg-surface/80 p-2 ring-1 ring-black/10 hover:bg-surface text-lg font-bold"
        >
          ›
        </button>
      </div>
    </div>
  );
}
