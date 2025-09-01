/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { useRef } from "react";
import SmartImage from "./SmartImage";
export default function MediaCarousel({ images = [] }) {
  const scroller = useRef(null);
  const scrollBy = (dx) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  if (!images.length) {
    return (
      <div className="aspect-[16/10] rounded-xl bg-muted grid place-items-center text-text-muted">
        No images
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {images.map((m, i) => (
          <div key={i} className="shrink-0 snap-start first:pl-0 last:pr-0">
            <div className="aspect-[16/10] w-[min(90vw,860px)] rounded-xl overflow-hidden bg-muted">
              <SmartImage
                url={m.url}
                alt={m.alt || `Image ${i + 1}`}
                className="h-full w-full object-cover"
                eager={i < 2}
                decoding="async"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Prev/Next */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollBy(-400)}
          className="pointer-events-auto rounded-full bg-surface/80 p-2 shadow-sm ring-1 ring-black/10 hover:bg-surface"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollBy(400)}
          className="pointer-events-auto rounded-full bg-surface/80 p-2 shadow-sm ring-1 ring-black/10 hover:bg-surface"
        >
          ›
        </button>
      </div>
    </div>
  );
}
