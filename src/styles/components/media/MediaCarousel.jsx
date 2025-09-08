// src/components/media/MediaCarousel.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useChunkedArray } from "../../hooks/useChunkedArray.js";
import { preloadImages } from "../../utils/preloadImages.js";
import "./MediaCarousel.css";

/**
 * MediaCarousel
 * - Renders only first 6 images on mount.
 * - Adds next 6 on demand when user navigates near the end or clicks "Next 6".
 * - Starts at picture 1 and does not move until the user interacts.
 *
 * @param {Array<string|{url:string,alt?:string}>} images
 * @param {number} chunkSize defaults to 6
 */
export default function MediaCarousel({ images = [], chunkSize = 6 }) {
  // Normalize input to {url, alt}
  const all = useMemo(
    () =>
      (images || []).map((img) =>
        typeof img === "string" ? { url: img, alt: "" } : img
      ),
    [images]
  );

  // Keep only the first N*k "visible" in the DOM
  const { visible, total, loadedCount, canLoadMore, loadNext } =
    useChunkedArray(all, chunkSize);

  // Hero + thumbnail window state
  const [activeIdx, setActiveIdx] = useState(0);
  const [thumbStart, setThumbStart] = useState(0); // 0,6,12,...

  // Reset position on new image set
  useEffect(() => {
    setActiveIdx(0); // start at pic 1
    setThumbStart(0);
  }, [all.length]);

  // Track first user engagement
  const engagedRef = useRef(false);
  const engage = () => {
    if (!engagedRef.current) engagedRef.current = true;
  };

  // Convenience helpers
  const goTo = (idx) => {
    engage();
    setActiveIdx(idx);
    // Ensure the thumbnail window contains the active slide
    if (idx < thumbStart) setThumbStart(Math.max(0, idx - (idx % chunkSize)));
    if (idx >= thumbStart + chunkSize)
      setThumbStart(idx - (idx % chunkSize));
  };

  const next = () => {
    engage();
    const nearEnd = activeIdx >= loadedCount - 2;
    if (nearEnd && canLoadMore) {
      // Reveal next batch and preload it
      const start = loadedCount;
      loadNext();
      const end = Math.min(start + chunkSize, all.length);
      preloadImages(all.slice(start, end).map((x) => x.url));
    }
    setActiveIdx((i) => Math.min(i + 1, all.length - 1));
  };

  const prev = () => {
    engage();
    setActiveIdx((i) => Math.max(0, i - 1));
  };

  const nextThumbPage = () => {
    engage();
    const nextStart = thumbStart + chunkSize;
    if (nextStart + chunkSize > loadedCount && canLoadMore) {
      const start = loadedCount;
      loadNext();
      const end = Math.min(start + chunkSize, all.length);
      preloadImages(all.slice(start, end).map((x) => x.url));
    }
    setThumbStart(Math.min(nextStart, Math.max(0, all.length - chunkSize)));
  };

  const prevThumbPage = () => {
    engage();
    setThumbStart(Math.max(0, thumbStart - chunkSize));
  };

  const thumbWindow = all.slice(
    thumbStart,
    Math.min(thumbStart + chunkSize, loadedCount)
  );

  // Guard for empty data
  if (!all.length) return null;

  const hero = all[activeIdx];

  return (
    <div className="mc">
      {/* HERO */}
      <div className="mc-hero">
        <button
          className="mc-nav"
          onClick={prev}
          aria-label="Previous photo"
          disabled={activeIdx === 0}
        >
          ‹
        </button>

        <img
          key={hero?.url || "empty"}
          src={hero?.url}
          alt={hero?.alt || `Photo ${activeIdx + 1}`}
          loading="eager"         /* initial image loads immediately */
          decoding="async"
          width="1280"
          height="800"
        />

        <button
          className="mc-nav"
          onClick={next}
          aria-label="Next photo"
          disabled={activeIdx >= all.length - 1}
        >
          ›
        </button>
      </div>

      {/* THUMBNAILS (6 per page) */}
      <div className="mc-thumbs" aria-label="Thumbnails">
        <button
          className="mc-page"
          onClick={prevThumbPage}
          disabled={thumbStart === 0}
          aria-label="Previous 6"
        >
          ‹6
        </button>

        <ul className="mc-thumblist">
          {thumbWindow.map((img, i) => {
            const idx = thumbStart + i;
            const isActive = idx === activeIdx;
            // Thumbs are lazily loaded
            return (
              <li key={img.url}>
                <button
                  className={`mc-thumb ${isActive ? "is-active" : ""}`}
                  aria-label={`Go to photo ${idx + 1}`}
                  onClick={() => goTo(idx)}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `Thumbnail ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    width="120"
                    height="90"
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <button
          className="mc-page"
          onClick={nextThumbPage}
          disabled={thumbStart + chunkSize >= Math.max(loadedCount, all.length)}
          aria-label="Next 6"
        >
          6›
        </button>
      </div>

      <div className="mc-meta" aria-live="polite">
        {activeIdx + 1} / {total}
      </div>
    </div>
  );
}
