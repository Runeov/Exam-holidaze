// src/pages/VenuesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listVenues } from "../api/venues";
import VenueGrid from "../components/VenueGrid";

const SERVER_LIMIT = 100; // API page size
const PER_PAGE_DEFAULT = 24; // UI default
const PER_PAGE_CHOICES = [24, 48]; // allowed per-page options
const CACHE_KEY = "venuesCache_v1"; // bump suffix to invalidate cache

const SORT_FIELDS = [
  { v: "created", label: "Newest" },
  { v: "updated", label: "Recently Updated" },
  { v: "price", label: "Price" },
  { v: "rating", label: "Rating" },
  { v: "name", label: "Name" },
];

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

  // URL state
  const q = searchParams.get("q") || "";
  // Always include owners in our dataset; URL param still respected for transparency
  const ownerFlag = (searchParams.get("_owner") ?? "true") === "true";

  const page = Math.max(1, parseNum(searchParams.get("page"), 1));
  const perParam = parseNum(searchParams.get("per"), PER_PAGE_DEFAULT);
  const per = PER_PAGE_CHOICES.includes(perParam) ? perParam : PER_PAGE_DEFAULT;

  const sort = searchParams.get("sort") || "created";
  const order = (searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  // Data state
  const [loading, setLoading] = useState(false);
  const [allVenues, setAllVenues] = useState([]);
  const [meta, setMeta] = useState({ totalCount: 0, pageCount: 0 });

  // Initial load: try localStorage cache first; otherwise fetch all pages once
  useEffect(() => {
    let cancelled = false;

    function loadFromCache() {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed?.data)) return false;

        console.group("[VenuesPage] cache hit");
        console.log("items:", parsed.data.length);
        console.log("cachedAt:", new Date(parsed.cachedAt).toISOString());
        console.groupEnd();

        setAllVenues(parsed.data);
        setMeta({
          totalCount: parsed.data.length,
          pageCount: Math.ceil(parsed.data.length / SERVER_LIMIT),
        });
        return true;
      } catch (e) {
        console.warn("[VenuesPage] cache read failed:", e);
        return false;
      }
    }

    async function fetchAll() {
      console.group("[VenuesPage] fetchAll (no-sort API; local sort)");
      console.log("ownerFlag:", ownerFlag);
      setLoading(true);
      try {
        // Fetch page 1 WITHOUT sort/order/q (we want full corpus once)
        const first = await listVenues({ page: 1, limit: SERVER_LIMIT, withOwner: ownerFlag });

        if (cancelled) return;

        const totalCount = first?.data?.meta?.totalCount ?? 0;
        const pageCount = first?.data?.meta?.pageCount ?? 1;
        let acc = Array.isArray(first?.data?.data) ? first.data.data : [];

        console.log(
          "page1 totalCount:",
          totalCount,
          "pageCount:",
          pageCount,
          "page1 items:",
          acc.length,
        );

        // Remaining pages
        const promises = [];
        for (let p = 2; p <= pageCount; p++) {
          promises.push(listVenues({ page: p, limit: SERVER_LIMIT, withOwner: ownerFlag }));
        }

        if (promises.length) {
          const rest = await Promise.all(promises);
          if (cancelled) return;
          for (let i = 0; i < rest.length; i++) {
            const pageData = rest[i]?.data?.data ?? [];
            console.log(
              `page${i + 2} items:`,
              Array.isArray(pageData) ? pageData.length : "not array",
            );
            if (Array.isArray(pageData)) acc = acc.concat(pageData);
          }
        }

        console.log("accumulated items:", acc.length);
        setAllVenues(acc);
        setMeta({ totalCount, pageCount });

        // Cache it
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: acc, cachedAt: Date.now() }));
          console.log("[VenuesPage] cache stored:", acc.length);
        } catch (e) {
          console.warn("[VenuesPage] cache write failed:", e);
        }
      } catch (e) {
        console.error("Failed to load venues", e);
        setAllVenues([]);
        setMeta({ totalCount: 0, pageCount: 0 });
      } finally {
        if (!cancelled) setLoading(false);
        console.groupEnd();
      }
    }

    const usedCache = loadFromCache();
    if (!usedCache) fetchAll();

    return () => {
      cancelled = true;
    };
    // We only want to run once on mount for cache/fetch bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerFlag]);

  // Client filter + LOCAL SORT (in-memory)
  const filteredSorted = useMemo(() => {
    const query = norm(q);
    let out = allVenues;

    // Filter: name/description/location/owner
    if (query) {
      out = allVenues.filter((v) => {
        const nameHit = includes(v?.name, query) || includes(v?.description, query);

        const loc = v?.location || {};
        const locHit =
          includes(loc.address, query) ||
          includes(loc.city, query) ||
          includes(loc.country, query) ||
          includes(loc.continent, query) ||
          includes(loc.zip, query);

        const ownerHit = includes(v?.owner?.name, query) || includes(v?.owner?.email, query);

        return nameHit || locHit || ownerHit;
      });
    }

    // Sort locally by chosen field
    const asc = order === "asc";
    out = [...out].sort((a, b) => {
      const av = a?.[sort];
      const bv = b?.[sort];

      // Handle nested fields if needed later (e.g., "owner.name")
      // For now we assume top-level fields as per requirement
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      // Dates (ISO strings) sort lexicographically fine; but we can improve robustness:
      const isDateLike = (val) => typeof val === "string" && /\d{4}-\d{2}-\d{2}T/.test(val);

      if (typeof av === "number" && typeof bv === "number") {
        return asc ? av - bv : bv - av;
      }
      if (isDateLike(av) && isDateLike(bv)) {
        const aTime = Date.parse(av);
        const bTime = Date.parse(bv);
        return asc ? aTime - bTime : bTime - aTime;
      }
      // Fallback to string compare
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

    console.debug("[VenuesPage] filter+localSort", {
      q,
      before: allVenues.length,
      after: out.length,
      sort,
      order,
    });

    return out;
  }, [q, allVenues, sort, order]);

  // Client pagination after filter+sort
  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / per));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * per;
  const end = start + per;
  const pageItems = filteredSorted.slice(start, end);

  console.debug("[VenuesPage] pagination", {
    per,
    pageRequested: page,
    pageUsed: safePage,
    pageCount,
    start,
    end,
    pageItems: pageItems.length,
  });

  // Helpers to update URL params (DRY)
  function setParam(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === "") next.delete(name);
    else next.set(name, String(value));
    // Reset to page 1 when changing per, sort, or order to avoid empty pages
    if (["per", "sort", "order"].includes(name)) next.set("page", "1");
    setSearchParams(next);
  }

  const pageOptions = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i + 1),
    [pageCount],
  );

  return (
    <div className="bg-muted min-h-screen">
      <div className="p-[var(--page-gutter)] max-w-[var(--container-max)] mx-auto space-y-6 bg-surface rounded-xl shadow-sm">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-text">Venues</h1>
            <p className="text-text-muted">
              Showing <b>{pageItems.length}</b> of <b>{filteredSorted.length}</b>
              {q ? (
                <>
                  {" "}
                  for “<b>{q}</b>”
                </>
              ) : null}{" "}
              · Page <b>{safePage}</b> / {pageCount}
            </p>
          </div>

          <Link
            to="/"
            className="text-sm underline text-[--color-brand-700] hover:text-[--color-brand-500]"
          >
            Back to Home
          </Link>
        </header>

        {/* Controls row: Sort, Order, Per-page, Page switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort field */}
          <label className="text-sm text-text flex items-center gap-2">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
            >
              {SORT_FIELDS.map((opt) => (
                <option key={opt.v} value={opt.v}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Order */}
          <label className="text-sm text-text flex items-center gap-2">
            <span>Order</span>
            <select
              value={order}
              onChange={(e) => setParam("order", e.target.value)}
              className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </label>

          {/* Per page */}
          <label className="text-sm text-text flex items-center gap-2">
            <span>Per page</span>
            <select
              value={per}
              onChange={(e) => setParam("per", Number(e.target.value))}
              className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
            >
              {PER_PAGE_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          {/* Page selector (only if >1 page) */}
          {pageCount > 1 && (
            <label className="text-sm text-text flex items-center gap-2 ml-auto">
              <span>Page</span>
              <select
                value={safePage}
                onChange={(e) => setParam("page", Number(e.target.value))}
                className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
              >
                {pageOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-text-muted">Loading venues…</p>
        ) : pageItems.length ? (
          <VenueGrid items={pageItems} />
        ) : (
          <p className="text-text-muted">No venues found.</p>
        )}

        {/* Pager buttons */}
        {pageCount > 1 && (
          <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Pagination">
            <button
              type="button"
              className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
              onClick={() => setParam("page", 1)}
              disabled={safePage === 1}
            >
              « First
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
              onClick={() => setParam("page", safePage - 1)}
              disabled={safePage <= 1}
            >
              ‹ Prev
            </button>
            <span className="text-sm text-text px-2">
              Page <b>{safePage}</b> of {pageCount}
            </span>
            <button
              type="button"
              className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
              onClick={() => setParam("page", safePage + 1)}
              disabled={safePage >= pageCount}
            >
              Next ›
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-1.5 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500]"
              onClick={() => setParam("page", pageCount)}
              disabled={safePage === pageCount}
            >
              Last »
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
