import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * HorizontalScroller
 * - Single-row, horizontally scrollable list with:
 *   • scroll snapping
 *   • arrow controls
 *   • drag-to-scroll
 *   • touch + wheel support
 *   • edge fade masks
 *   • a11y (aria-labels, roving tab stop safe)
 *
 * Props:
 *  - title?: string
 *  - items: T[]
 *  - keyFor: (item: T, index: number) => string
 *  - renderItem: (item: T, index: number) => ReactNode
 *  - scrollBy?: number  // pixels to scroll per arrow click (default: 0.9 * container width)
 *  - className?: string // extra classes for wrapper
 */
export default function HorizontalScroller({
  title,
  items,
  keyFor,
  renderItem,
  scrollBy,
  className = "",
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // compute scrollability
  const updateScrollState = () => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  // keep state in sync on resize & scroll
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    updateScrollState();
    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // drag-to-scroll (desktop)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onPointerDown = (e: PointerEvent) => {
      // allow text selection inside cards; only drag with middle/left button on the track background.
      if (e.button === 2) return;
      isDown = true;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
      (el as HTMLElement).style.scrollSnapType = "none"; // smooth dragging
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      el.scrollLeft = startScrollLeft - dx;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      (el as HTMLElement).style.scrollSnapType = ""; // restore snap
      el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  const handleArrow = (dir: "left" | "right") => {
    const el = viewportRef.current;
    if (!el) return;
    const delta = scrollBy ?? Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "left" ? -delta : delta, behavior: "smooth" });
  };

  const hasItems = (items?.length ?? 0) > 0;

  return (
    <section className={`relative ${className}`} aria-label={title || "Items"}>
      {/* Title + arrows */}
      <div className="mb-3 flex items-center justify-between gap-3">
        {title ? (
          <h3 className="text-xl md:text-2xl font-semibold text-black">{title}</h3>
        ) : (
          <span aria-hidden />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleArrow("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="rounded-full border border-black/10 bg-white px-2 py-2 shadow-sm disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 15.707a1 1 0 010-1.414L15.586 11H4a1 1 0 110-2h11.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" transform="scale(-1,1) translate(-20,0)" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleArrow("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="rounded-full border border-black/10 bg-white px-2 py-2 shadow-sm disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 15.707a1 1 0 010-1.414L15.586 11H4a1 1 0 110-2h11.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="
          group/viewport relative overflow-x-auto overflow-y-visible
          scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]
          snap-x snap-mandatory
          -mx-4 px-4
        "
        onScroll={updateScrollState}
      >
        {/* hide scrollbar (webkit) */}
        <style>
          {`
          .group\\/viewport::-webkit-scrollbar { display: none; }
          `}
        </style>

        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />

        {/* Track */}
        <ul
          className="
            flex gap-4
            [--card-w:16rem] md:[--card-w:18rem]
            "
          role="list"
        >
          {hasItems ? (
            items.map((item, i) => (
              <li
                key={keyFor(item, i)}
                className="snap-start shrink-0 w-[var(--card-w)]"
              >
                {renderItem(item, i)}
              </li>
            ))
          ) : (
            <li className="w-full py-8 text-text-muted">No items</li>
          )}
        </ul>
      </div>
    </section>
  );
}
