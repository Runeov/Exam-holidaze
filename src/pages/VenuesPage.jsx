// src/pages/VenuesPage.jsx
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { listVenues } from "../api/venues";
import VenueGrid from "../components/VenueGrid";
import { hasBookingConflict } from "../utils/dates";

function useQueryParams() {
  const { search } = useLocation();
  return Object.fromEntries(new URLSearchParams(search));
}

function norm(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function includes(hay, needle) {
  return norm(hay).includes(norm(needle));
}

function parseNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function VenuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useQueryParams();

  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseNum(searchParams.get("page"), 1));
  const sort = searchParams.get("sort") || "created";
  const order =
    (searchParams.get("order") || searchParams.get("sortOrder") || "desc").toLowerCase() === "asc"
      ? "asc"
      : "desc";

  const [loading, setLoading] = useState(false);
  const [allVenues, setAllVenues] = useState([]);

  // Filters from URL
  const filters = {
    place: query.place?.toLowerCase(),
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    min: query.min ? Number(query.min) : 0,
    max: query.max ? Number(query.max) : 9999,
    features: query.features
      ? Array.isArray(query.features)
        ? query.features
        : [query.features]
      : [],
  };

  const hasActiveFilters = Boolean(
    filters.place ||
      filters.from ||
      filters.to ||
      filters.min > 0 ||
      filters.max < 9999 ||
      (filters.features && filters.features.length > 0),
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      try {
        const first = await listVenues({ page: 1, limit: 100 });
        if (cancelled) return;

        let venues = Array.isArray(first?.data?.data) ? first.data.data : [];
        const pageCount = first?.data?.meta?.pageCount ?? 1;

        const requests = [];
        for (let p = 2; p <= pageCount; p++) {
          requests.push(listVenues({ page: p, limit: 100 }));
        }

        const responses = await Promise.all(requests);
        for (const res of responses) {
          if (Array.isArray(res?.data?.data)) {
            venues = venues.concat(res.data.data);
          }
        }

        setAllVenues(venues);
      } catch (e) {
        console.error("Failed to fetch venues", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }
    fetchAll();
  }, []);

  const filteredSorted = useMemo(() => {
    let out = [...allVenues];

    // Search
    if (q) {
      const qNorm = norm(q);
      out = out.filter((v) => {
        const name = includes(v.name, qNorm);
        const desc = includes(v.description, qNorm);
        const loc = v.location || {};
        const locHit =
          includes(loc.city, qNorm) ||
          includes(loc.country, qNorm) ||
          includes(loc.address, qNorm) ||
          includes(loc.zip, qNorm);
        return name || desc || locHit;
      });
    }

    // Place
    if (filters.place) {
      out = out.filter((v) => {
        const loc = v.location || {};
        return (
          includes(v.name, filters.place) ||
          includes(loc.city, filters.place) ||
          includes(loc.country, filters.place) ||
          includes(loc.zip, filters.place)
        );
      });
    }

    // Date range
    if (filters.from && filters.to) {
      out = out.filter((v) => !hasBookingConflict(v.bookings, filters.from, filters.to));
    }

    // Price range
    out = out.filter((v) => v.price >= filters.min && v.price <= filters.max);

    // Features
    for (const feature of filters.features) {
      out = out.filter((v) => v.meta?.[feature] === true);
    }

    // Sort
    const asc = order === "asc";
    out = out.sort((a, b) => {
      const av = a?.[sort];
      const bv = b?.[sort];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      // Dates
      const aTime = Date.parse(av);
      const bTime = Date.parse(bv);
      if (!isNaN(aTime) && !isNaN(bTime)) {
        return asc ? aTime - bTime : bTime - aTime;
      }

      // Numbers
      if (typeof av === "number" && typeof bv === "number") {
        return asc ? av - bv : bv - av;
      }

      // Strings / fallback
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

    return out;
  }, [allVenues, q, filters, sort, order]);

  // Pagination
  const PER_PAGE = 24;
  const pageCount = Math.ceil(filteredSorted.length / PER_PAGE);
  const safePage = Math.min(page, pageCount || 1);
  const start = (safePage - 1) * PER_PAGE;
  const pageItems = filteredSorted.slice(start, start + PER_PAGE);

  // ---------- UI helpers: Sort tabs ----------
  const sortFields = [
    { key: "created", label: "Created" },
    { key: "updated", label: "Updated" },
    { key: "price", label: "Price" },
    { key: "rating", label: "Rating" },
    { key: "name", label: "Name" },
  ];

  function updateParams(next) {
    const current = Object.fromEntries(searchParams);
    const merged = { ...current, ...next, page: "1" };
    if (merged.order) merged.sortOrder = merged.order; // Noroff naming compat
    setSearchParams(merged);
  }

  function handleSelectSort(fieldKey) {
    updateParams({ sort: fieldKey });
  }

  function toggleOrder() {
    updateParams({ order: order === "asc" ? "desc" : "asc" });
  }

  // ---------- Simple pager handlers ----------
  const canPrev = safePage > 1;
  const canNext = safePage < (pageCount || 1);

  function goPrev() {
    if (!canPrev) return;
    const current = Object.fromEntries(searchParams);
    setSearchParams({ ...current, page: String(safePage - 1), sortOrder: order });
  }

  function goNext() {
    if (!canNext) return;
    const current = Object.fromEntries(searchParams);
    setSearchParams({ ...current, page: String(safePage + 1), sortOrder: order });
  }

  return (
    <div className="min-h-screen bg-muted py-6">
      <div className="max-w-6xl mx-auto rounded-xl p-6 space-y-6">
        <header className="space-y-2 text-white">
          <h1 className="text-2xl font-bold">Venues</h1>
          <p className="text-sm text-white/80">
            Showing {pageItems.length} of {filteredSorted.length} results
          </p>

          {/* Sort Tabs (fields + order toggle) */}
          <div className="flex flex-wrap items-center gap-2 pt-2" role="tablist" aria-label="Sort">
            <div className="flex flex-wrap gap-1" aria-label="Sort fields">
              {sortFields.map((f) => {
                const active = sort === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={[
                      "px-3 py-1.5 rounded-full text-sm border transition",
                      active
                        ? "bg-[color:var(--color-brand-800)] text-white border-transparent shadow"
                        : "bg-white/15 text-white border-white/20 hover:bg-white/25",
                    ].join(" ")}
                    onClick={() => handleSelectSort(f.key)}
                    title={`Sort by ${f.label}`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="h-6 w-px bg-white/30 mx-1" aria-hidden />

            <button
              type="button"
              role="tab"
              aria-selected={true}
              aria-label={`Toggle order: currently ${order.toUpperCase()}`}
              className="px-3 py-1.5 rounded-full text-sm border bg-white/10 hover:bg-white/20 text-white border-white/20 inline-flex items-center gap-1"
              onClick={toggleOrder}
              title={`Order: ${order.toUpperCase()}`}
            >
              <span className="font-medium">Order</span>
              <span className="inline-flex items-center">{order === "asc" ? "ASC ↑" : "DESC ↓"}</span>
            </button>
          </div>
        </header>

        {/* Page-local style: center card title & meta; light card look */}
        <style>{`
          /* Center the card title and the next line */
          .venuespage-cardwrap ul.grid > li h3 {
            text-align: center;
          }
          .venuespage-cardwrap ul.grid > li h3 + * {
            text-align: center;
            justify-content: center;
          }

          /* Make each li look like: rounded-xl border border-black/10 bg-surface shadow-sm hover:shadow-md transition */
          .venuespage-cardwrap ul.grid > li {
            background-color: var(--color-surface, #ffffff); /* bg-surface */
            border: 1px solid rgba(0,0,0,0.10);             /* border-black/10 */
            border-radius: 0.75rem;                         /* rounded-xl */
            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);       /* shadow-sm */
            transition: box-shadow .2s ease, transform .2s ease, background-color .2s ease;
            overflow: hidden;
          }
          .venuespage-cardwrap ul.grid > li:hover {
            box-shadow:
              0 4px 6px -1px rgba(0,0,0,0.10),
              0 2px 4px -2px rgba(0,0,0,0.10);              /* hover:shadow-md */
          }
          .venuespage-cardwrap ul.grid > li:focus-within {
            outline: 2px solid var(--color-brand-300);
            outline-offset: 2px;
          }
        `}</style>

        <div className="venuespage-cardwrap">
          {loading ? (
            <p className="text-white/80">Loading venues…</p>
          ) : pageItems.length > 0 ? (
            <VenueGrid items={pageItems} />
          ) : (
            <p className="text-white/80">No venues found.</p>
          )}
        </div>

        {/* Simple Pager */}
        <div className="flex items-center justify-center gap-4 pt-4 text-white">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev}
            className={[
              "px-4 py-2 rounded-full border text-sm",
              canPrev
                ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                : "bg-white/10 text-white/40 border-white/10 cursor-not-allowed",
            ].join(" ")}
            aria-disabled={!canPrev}
          >
            Prev
          </button>

          <span className="text-sm text-white/80">
            Page <span className="font-semibold">{safePage}</span> of{" "}
            <span className="font-semibold">{pageCount || 1}</span>
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className={[
              "px-4 py-2 rounded-full border text-sm",
              canNext
                ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                : "bg-white/10 text-white/40 border-white/10 cursor-not-allowed",
            ].join(" ")}
            aria-disabled={!canNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
