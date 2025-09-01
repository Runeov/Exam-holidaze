// src/components/HeroCarousel.jsx
/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: <explanation> */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listVenues } from "../api/venues";

export default function HeroCarousel() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const scrollerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setStatus("loading");
        const res = await listVenues({
          page: 1,
          limit: 6,
          sort: "rating",
          order: "desc",
          withOwner: true,
        });
        const data = res?.data?.data || [];
        if (alive) {
          setItems(data);
          setStatus("idle");
        }
      } catch {
        if (alive) setStatus("error");
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, []);

  function scrollBy(delta) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  if (status === "loading") {
    return (
      <div
        className="h-[18rem] md:h-[22rem] w-full rounded-2xl bg-muted shadow-md animate-pulse"
        aria-label="Loading carousel"
      />
    );
  }
  if (status === "error") {
    return (
      <p className="text-sm text-error-500">Couldn’t load featured images. Please try again.</p>
    );
  }
  if (!items.length) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-muted shadow-md scroll-smooth scrollbar-hide"
        style={{ scrollPaddingLeft: "1rem" }}
        aria-label="Featured venues carousel"
      >
        {items.map((v) => {
          const img =
            v?.media?.[0]?.url ||
            "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1600&auto=format&fit=crop";
          const city = v?.location?.city || "";
          const country = v?.location?.country || "";
          return (
            <Link
              to={`/venues/${v.id}`}
              key={v.id}
              className="relative mx-2 my-2 inline-block h-[20rem] sm:h-[22rem] lg:h-[26rem] w-[88vw] flex-none snap-center overflow-hidden rounded-2xl bg-surface sm:w-[560px] lg:w-[760px] xl:w-[920px]"
            >
              <img
                src={img}
                alt={v?.name || "Venue"}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h3 className="text-xl font-semibold drop-shadow">{v?.name}</h3>
                <p className="text-sm opacity-90">
                  {city}
                  {city && country ? ", " : ""}
                  {country}
                </p>
                {Number.isFinite(v?.price) && (
                  <p className="mt-1 text-sm">
                    <span className="font-bold">€{v.price}</span> / night
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Controls */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => scrollBy(-500)}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-surface/90 shadow ring-1 ring-black/10 backdrop-blur hover:brightness-110"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => scrollBy(500)}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-surface/90 shadow ring-1 ring-black/10 backdrop-blur hover:brightness-110"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  );
}
