// src/pages/VenuesPage.jsx

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { listVenues } from "../api/venues";
import VenueGrid from "../components/VenueGrid";

const DEFAULT_LIMIT = 24;

export default function VenuesPage() {
  const [params, setParams] = useSearchParams();

  // URL state
  const q = params.get("q") || "";
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") || DEFAULT_LIMIT)));

  // Data
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["venues", { q, page, limit }],
    queryFn: async ({ queryKey, signal }) => {
      const [, s] = queryKey;
      const res = await listVenues({
        page: s.page,
        limit: s.limit,
        q: s.q?.trim() || undefined,
        withOwner: true,
        signal,
      });
      // Normalize payload shape
      const payload =
        res?.data && (Array.isArray(res.data?.data) || res.data?.meta) ? res.data : res;
      return payload;
    },
    keepPreviousData: true,
  });

  const venues = data?.data ?? [];
  const pageCount = data?.meta?.pageCount ?? 1;
  const totalCount = data?.meta?.totalCount ?? venues.length;

  function updateParams(next) {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(next)) {
        if (v == null || v === "") p.delete(k);
        else p.set(k, String(v));
      }
      return p;
    });
  }

  // Preload first 3 images on each page (with cleanup)
  useEffect(() => {
    const links = venues
      .slice(0, 3)
      .map((v) => {
        const url = v?.media?.[0]?.url;
        if (!url) return null;
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = url;
        document.head.appendChild(link);
        return link;
      })
      .filter(Boolean);

    return () => {
      links.forEach((l) => {
        document.head.removeChild(l);
      });
    };
  }, [venues]);

  // Stable keys for skeletons (no array index)
  const SKELETON_KEYS = useMemo(
    () =>
      Array.from({ length: 6 }, () => {
        const uuid = globalThis.crypto?.randomUUID?.();
        return uuid ?? Math.random().toString(36).slice(2);
      }),
    [],
  );

  // Precompute list of pages for the <select> (stable + readable)
  const pageOptions = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i + 1),
    [pageCount],
  );

  return (
    <div className="bg-muted min-h-screen">
      <div className="p-[var(--page-gutter)] max-w-[var(--container-max)] mx-auto space-y-6 bg-surface rounded-xl shadow-sm">
        <header className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-text">Venues</h1>
            <p className="text-text-muted">
              Showing <b>{venues.length}</b> of <b>{totalCount}</b> · Page <b>{page}</b> /{" "}
              {pageCount}
            </p>
          </div>

          {/* Search */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 md:justify-center"
            aria-label="Search venues"
          >
            <input
              name="q"
              value={q}
              onChange={(e) => updateParams({ q: e.target.value, page: 1 })}
              placeholder="Search venues…"
              className="px-3 py-2 rounded-lg border border-black/10 bg-surface text-text placeholder:text-text-muted w-56"
            />
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-[--color-brand-500] text-white hover:brightness-110"
              onClick={() => updateParams({ q, page: 1 })}
            >
              Search
            </button>
          </form>

          {/* Limit */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            <select
              value={limit}
              onChange={(e) => updateParams({ limit: Number(e.target.value), page: 1 })}
              className="px-3 py-2 rounded-lg border border-black/10 bg-surface text-text"
            >
              {[12, 24, 48, 96].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Top pagination */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-black/10 bg-surface"
            disabled={page <= 1 || Boolean(isFetching)}
            onClick={() => updateParams({ page: Math.max(1, page - 1) })}
          >
            Prev
          </button>

          <select
            value={page}
            onChange={(e) => updateParams({ page: Number(e.target.value) })}
            className="px-3 py-2 rounded-lg border border-black/10 bg-surface"
          >
            {pageOptions.map((p) => (
              <option key={p} value={p}>
                Page {p}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-black/10 bg-surface"
            disabled={page >= pageCount || Boolean(isFetching)}
            onClick={() => updateParams({ page: Math.min(pageCount, page + 1) })}
          >
            Next
          </button>
        </div>

        {/* Grid */}
        {isLoading && venues.length === 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKELETON_KEYS.map((key) => (
              <li key={key} className="rounded-xl border border-black/10 p-4 animate-pulse">
                <div className="aspect-[16/10] rounded-lg bg-muted mb-3" />
                <div className="h-4 w-2/3 bg-muted mb-2 rounded" />
                <div className="h-3 w-full bg-muted mb-2 rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </li>
            ))}
          </ul>
        ) : (
          <VenueGrid venues={venues} />
        )}

        {/* Bottom pagination */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-black/10 bg-surface"
            disabled={page <= 1 || Boolean(isFetching)}
            onClick={() => updateParams({ page: Math.max(1, page - 1) })}
          >
            Prev
          </button>

          <select
            value={page}
            onChange={(e) => updateParams({ page: Number(e.target.value) })}
            className="px-3 py-2 rounded-lg border border-black/10 bg-surface"
          >
            {pageOptions.map((p) => (
              <option key={p} value={p}>
                Page {p}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-black/10 bg-surface"
            disabled={page >= pageCount || Boolean(isFetching)}
            onClick={() => updateParams({ page: Math.min(pageCount, page + 1) })}
          >
            Next
          </button>
        </div>

        {isFetching && !isLoading && <p className="text-center text-text-muted mt-2">Loading…</p>}
      </div>{" "}
    </div>
  );
}
