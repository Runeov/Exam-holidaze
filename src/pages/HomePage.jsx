// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listVenues } from "../api/venues";
import FeaturedVenues from "../components/FeaturedVenues";
import MediaCarousel from "../components/MediaCarousel";
import SearchBar from "../components/SearchBar";

export default function HomePage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // Per docs: response is { data: Venue[], meta: {...} }
        const res = await listVenues(
          {
            page: 1,
            limit: 60,
            sort: "rating",
            order: "desc",
            withOwner: false,
            signal: ac.signal,
          },
          undefined, // public endpoint, no auth
        );
        setVenues(res?.data?.data ?? []);
      } catch (err) {
        if (err?.name !== "AbortError") console.error("listVenues failed", err);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const featured = useMemo(() => venues.filter((v) => (v?.rating ?? 0) >= 4).slice(0, 6), [venues]);

  const heroMedia = useMemo(() => {
    const hasImage = (v) => Boolean(v?.media?.[0]?.url);
    const toSlide = (v, i) => {
      const m = v.media[0];
      return { url: m.url, alt: m.alt || `Hero ${i + 1}` };
    };

    // Prefer featured w/ images; if not enough, top up from the rest that have images
    const fromFeatured = featured.filter(hasImage).map(toSlide).slice(0, 6);
    if (fromFeatured.length >= 3) return fromFeatured;

    const more = venues.filter(hasImage).map(toSlide);
    return [...fromFeatured, ...more].slice(0, 6);
  }, [featured, venues]);

  return (
    <main className="space-y-16 px-[var(--page-gutter-wide)] pb-16">
      {/* Hero */}
      <section className="relative bg-brand-50 rounded-xl shadow-sm mb-12 min-h-screen flex items-center">
        <div className="px-[var(--page-gutter-wide)] space-y-8 text-center w-full">
          <h1 className="text-4xl font-bold text-brand-700">Find your perfect stay</h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Browse unique places to stay, discover hidden gems, and book your next adventure with
            Holidaze.
          </p>
          <div className="max-w-5xl mx-auto">
            <MediaCarousel images={heroMedia} />
          </div>
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {!loading && featured.length > 0 && <FeaturedVenues venues={featured} />}
      {loading && <div className="text-center p-12 text-text-muted">Loading featured venues…</div>}
    </main>
  );
}
