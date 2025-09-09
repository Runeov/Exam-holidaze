// src/components/MediaCarousel.jsx
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "./SmartImage";

/**
 * MediaCarousel
 *
 * Props:
 * - images: Array<{ url: string, alt?: string, name?: string, location?: string, subLocation?: string }>
 * - progressive?: boolean
 * - initial?: number
 * - step?: number
 * - afterIdle?: number
 * - onReachCount?: (count:number, cause:'io'|'manual'|'idle') => void
 * - onShowMore?: (location?: string) => void
 * - heroSrc?: string                     // local, optimized hero (LCP)
 * - heroAlt?: string
 * - heroSrcSet?: string                  // "/img-800.webp 800w, /img-1200.webp 1200w, ..."
 * - heroSizes?: string                   // "100vw" etc.
 * - heroClassName?: string               // extra classes; size is handled by spacer
 */
export default function MediaCarousel({
  images = [],
  progressive = true,
  initial = 6,
  step = 6,
  afterIdle = 0,
  onReachCount,
  onShowMore,
  heroSrc,
  heroAlt = "Featured destination",
  heroSrcSet,
  heroSizes = "100vw",
  heroClassName = "",
}) {
  const scroller = useRef(null);
  const ioRef = useRef(null);
  const engagedRef = useRef(false);
  const idleTimerRef = useRef(null);

  // Normalize slides
  const slides = useMemo(
    () =>
      (Array.isArray(images) ? images : [])
        .map((m) => {
          if (!m) return null;
          if (typeof m === "string") return { url: m, alt: "" };
          const url = m.url || m.src || m.image || (m.media && (m.media.url || m.media.src)) || null;
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
    setCount(progressive ? Math.min(initial, slides.length) : slides.length);
  }, [slides.length, progressive, initial]);

  // Mark engagement
  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const onEngage = () => {
      if (!engagedRef.current) engagedRef.current = true;
    };
    node.addEventListener("scroll", onEngage, { passive: true });
    node.addEventListener("pointerdown", onEngage, { passive: true });
    node.addEventListener("keydown", onEngage, { passive: true });
    return () => {
      node.removeEventListener("scroll", onEngage);
      node.removeEventListener("pointerdown", onEngage);
      node.removeEventListener("keydown", onEngage);
    };
  }, []);

  // IO progressive reveal (after engagement)
  useEffect(() => {
    if (!progressive || !scroller.current) return;
    const node = scroller.current;
    const sentinel = node.querySelector("[data-carousel-sentinel]");
    if (!sentinel) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!engagedRef.current) return;
          setCount((c) => {
            const next = Math.min(c + step, slides.length);
            if (typeof onReachCount === "function" && next !== c) onReachCount(next, "io");
            return next;
          });
        }
      },
      { root: node, threshold: 0.75 },
    );

    io.observe(sentinel);
    ioRef.current = io;
    return () => io.disconnect();
  }, [progressive, slides.length, step, onReachCount]);

  // Optional idle growth (after engagement)
  useEffect(() => {
    if (!progressive || !afterIdle || afterIdle <= 0) return;
    if (!engagedRef.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setCount((c) => {
        const next = Math.min(c + afterIdle, slides.length);
        if (typeof onReachCount === "function" && next !== c) onReachCount(next, "idle");
        return next;
      });
    }, 1200);
    return () => idleTimerRef.current && clearTimeout(idleTimerRef.current);
  }, [progressive, afterIdle, slides.length, onReachCount]);

  // Force start at first image (avoid snap-to-end)
  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const prev = typeof history !== "undefined" ? history.scrollRestoration : undefined;
    try {
      if (typeof history !== "undefined") history.scrollRestoration = "manual";
    } catch {}
    const raf1 = requestAnimationFrame(() => {
      node.scrollTo({ left: 0, behavior: "auto" });
      const raf2 = requestAnimationFrame(() => node.scrollTo({ left: 0, behavior: "auto" }));
      node.__raf2 = raf2;
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (node.__raf2) cancelAnimationFrame(node.__raf2);
      try {
        if (typeof history !== "undefined" && prev) history.scrollRestoration = prev;
      } catch {}
    };
  }, [slides.length]);

  const shown = slides.slice(0, count);

  // ---------- LCP hero overlay + reveal carousel ----------
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Preload first slide; when ready → show carousel (keeps hero from pushing)
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReduceMotion(!!mq?.matches);
    const onChange = (e) => setReduceMotion(!!e.matches);
    mq?.addEventListener?.("change", onChange);

    let img;
    if (shown[0]?.url) {
      img = new Image();
      img.decoding = "async";
      img.src = shown[0].url;
      img.onload = () => setFirstLoaded(true);
      img.onerror = () => setFirstLoaded(true); // fail open
    } else {
      setFirstLoaded(true);
    }
    return () => {
      mq?.removeEventListener?.("change", onChange);
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [shown.length]);

  // ---------------- RETURN ----------------
  return (
    <div
      className="w-full text-center pt-4 md:pt-8 pb-12 space-y-0 
                 px-0 sm:px-0 md:px-0 lg:px-[var(--page-gutter-wide)]"
    >
      {/* Stage reserves height to prevent CLS; hero + scroller are overlayed */}
      <div className="relative">
        {/* Spacer: same aspect/width as a card so the stage has height */}
        <div className="invisible pointer-events-none aspect-[16/10] w-[92vw] md:w-[86vw] lg:w-[82vw] max-w-[1400px] mx-auto" />

        {/* HERO (LCP) — absolutely positioned, fades out */}
        {heroSrc && (
          <div
            className={[
              "absolute inset-0 flex items-center justify-center",
              firstLoaded
                ? reduceMotion
                  ? "opacity-0"
                  : "opacity-0 transition-opacity duration-500 ease-out"
                : "opacity-100",
            ].join(" ")}
            aria-hidden={firstLoaded ? "true" : "false"}
          >
         <SmartImage
  src={m.url}
  url={m.url}
  alt={m.alt || `Image ${i + 1}`}
  className="h-full w-full object-cover
             object-[65%_20%] sm:object-[70%_20%] md:object-[72%_18%] lg:object-[75%_15%]"
  eager={false}
  decoding="async"
  fetchPriority="low"
  width={1600}
  height={1000}
/>
          </div>
        )}

        {/* SCROLLER — absolutely positioned, slides in; occupies the same stage box */}
        <div
          ref={scroller}
          id="hero-scroller"
          className={[
            "absolute inset-0 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide",
            "pl-6 md:pl-12 lg:pl-[calc(var(--page-gutter-wide)+1rem)] xl:pl-[calc(var(--page-gutter-wide)+2rem)]",
            firstLoaded
              ? "opacity-100 translate-x-0"
              : reduceMotion
              ? "opacity-0"
              : "opacity-0 translate-x-6",
            "transition-all duration-500 ease-out",
          ].join(" ")}
          /* biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation> */
          tabIndex={0}
          style={firstLoaded || reduceMotion ? undefined : { willChange: "transform, opacity" }}
        >
          {shown.map((m, i) => (
            <div
              key={i}
              className="shrink-0 snap-start first:snap-always first:pl-0 last:pr-0"
              style={i === 0 ? { scrollSnapStop: "always" } : undefined}
            >
              <div
                className="relative aspect-[16/10] w-[92vw] md:w-[86vw] lg:w-[82vw] 
                           max-w-[1400px] rounded-xl overflow-hidden bg-muted"
              >
                <SmartImage
  src={m.url}
  url={m.url}
  alt={m.alt || `Image ${i + 1}`}
  className="h-full w-full object-cover
             object-[65%_20%] sm:object-[70%_20%] md:object-[72%_18%] lg:object-[75%_15%]"
  eager={i === 0}
  decoding="async" fetchPriority="low" width={1600} height={1000} />




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
                                     focus-visible:ring-offset-black/20"
                          onClick={() => {
                            if (!engagedRef.current) engagedRef.current = true;
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

          {/* Sentinel (smaller to match tighter gaps) */}
          {progressive && count < slides.length && (
            <div
              data-carousel-sentinel
              aria-hidden="true"
              className="shrink-0 w-3"
              style={{ scrollSnapAlign: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}