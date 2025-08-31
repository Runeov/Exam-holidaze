// src/pages/VenuesPage.jsx
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listVenues } from "../api/venues";

const IMG_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#e5e7eb"/>
          <stop offset="1" stop-color="#d1d5db"/>
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#g)"/>
      <g fill="#9ca3af">
        <circle cx="35" cy="50" r="12"/>
        <rect x="54" y="42" width="72" height="16" rx="3"/>
      </g>
    </svg>`,
  );

const DEFAULT_LIMIT = 25;
const API_PAGE_LIMIT = 100;

const SORT_FIELDS = [
  { value: "created", label: "Newest" },
  { value: "data_name", label: "Name" },
  { value: "data_price", label: "Price" },
  { value: "data_location", label: "Location" },
];

export default function VenuesPage() {
  const [params, setParams] = useSearchParams();

  // URL state
  const q = params.get("q") || "";
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") || DEFAULT_LIMIT)));
  const sort = params.get("sort") || "created";
  const order = params.get("order") || "desc";

  function updateParams(entries) {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      for (const [name, value] of Object.entries(entries)) {
        if (value === "" || value == null) p.delete(name);
        else p.set(name, String(value));
      }
      return p;
    });
  }

  // Fetch ALL pages once
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["venues-all", { q }],
    queryFn: async ({ queryKey, signal }) => {
      const [, s] = queryKey;

      const first = await listVenues({
        page: 1,
        limit: API_PAGE_LIMIT,
        q: (s.q || "").trim() || undefined,
        withOwner: true,
        signal,
      });
      const firstPayload =
        first?.data && (Array.isArray(first.data?.data) || first.data?.meta) ? first.data : first;

      const pageCount = firstPayload?.meta?.pageCount || 1;

      if (pageCount <= 1) {
        console.log("📦 Loaded venues:", firstPayload?.data?.length || 0);
        return firstPayload;
      }

      const restPages = Array.from({ length: pageCount - 1 }, (_, i) => i + 2);
      const rest = await Promise.all(
        restPages.map((p) =>
          listVenues({
            page: p,
            limit: API_PAGE_LIMIT,
            q: (s.q || "").trim() || undefined,
            withOwner: true,
            signal,
          }).then((r) => (r?.data && (Array.isArray(r.data?.data) || r.data?.meta) ? r.data : r)),
        ),
      );

      const allData = [...(firstPayload?.data || []), ...rest.flatMap((r) => r?.data || [])];

      console.log("📦 Loaded venues:", allData.length);

      return { data: allData, meta: { totalCount: allData.length } };
    },
    keepPreviousData: true,
  });

  const rowsRaw = data?.data ?? [];
  const totalCount = data?.meta?.totalCount || rowsRaw.length;

  const globallySorted = useMemo(() => {
    const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
    const getLoc = (v) =>
      `${v?.location?.country || ""} ${v?.location?.city || ""} ${v?.location?.address || ""}`.trim();

    const qstr = (q || "").trim().toLowerCase();
    const filtered = qstr
      ? rowsRaw.filter((v) => {
          const hay = `${v?.name || ""} ${v?.description || ""} ${getLoc(v)}`.toLowerCase();
          return hay.includes(qstr);
        })
      : rowsRaw;

    if (sort === "data_name")
      filtered.sort((a, b) => collator.compare(a?.name || "", b?.name || ""));
    else if (sort === "data_price")
      filtered.sort((a, b) => (+a?.price || Infinity) - (+b?.price || Infinity));
    else if (sort === "data_location")
      filtered.sort((a, b) => collator.compare(getLoc(a), getLoc(b)));
    else if (sort === "created")
      filtered.sort(
        (a, b) => new Date(a?.created || 0).getTime() - new Date(b?.created || 0).getTime(),
      );

    return order === "desc" ? [...filtered].reverse() : filtered;
  }, [rowsRaw, q, sort, order]);

  const clientTotal = globallySorted.length;
  const clientPageCount = Math.max(1, Math.ceil(clientTotal / limit));
  const pageSafe = Math.min(page, clientPageCount);
  const start = (pageSafe - 1) * limit;
  const end = start + limit;
  const pageRows = globallySorted.slice(start, end);

  useEffect(() => {
    pageRows.slice(0, 3).forEach((v) => {
      const url = v?.media?.[0]?.url;
      if (!url) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    });
  }, [pageRows]);

  // Debug: show slice
  useEffect(() => {
    console.log(
      `📑 Showing slice [${start}:${end}) of ${clientTotal} (page ${pageSafe}/${clientPageCount})`,
    );
  }, [start, end, clientTotal, pageSafe, clientPageCount]);

  // Handlers
  function onSearch(e) {
    e.preventDefault();
  }
  function onSortChange(e) {
    updateParams({ sort: e.target.value, page: 1 });
  }
  function onOrderChange(e) {
    updateParams({ order: e.target.value, page: 1 });
  }
  function onPageChange(e) {
    updateParams({ page: e.target.value });
  }
  function onLimitChange(e) {
    updateParams({ limit: e.target.value, page: 1 });
  }

  // Small reusable block for pagination (used on top & bottom)
  function Pagination() {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          className="px-3 py-2 rounded-lg border"
          disabled={pageSafe <= 1 || isFetching}
          onClick={() => updateParams({ page: Math.max(1, pageSafe - 1) })}
        >
          Prev
        </button>

        <select value={pageSafe} onChange={onPageChange} className="px-3 py-2 rounded-lg border">
          {Array.from({ length: clientPageCount }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              Page {p}
            </option>
          ))}
        </select>

        <button
          className="px-3 py-2 rounded-lg border"
          disabled={pageSafe >= clientPageCount || isFetching}
          onClick={() => updateParams({ page: Math.min(clientPageCount, pageSafe + 1) })}
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Venues</h1>
          <p className="text-gray-600">
            Showing <b>{pageRows.length}</b> of <b>{totalCount}</b> · Page <b>{pageSafe}</b> /{" "}
            {clientPageCount}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={onSearch} className="flex gap-2 md:justify-center">
          <input
            name="q"
            value={q ?? ""}
            onChange={(e) => updateParams({ q: e.target.value, page: 1 })}
            placeholder="Search venues…"
            className="px-3 py-2 rounded-lg border w-56"
          />
          <button className="px-3 py-2 rounded-lg bg-gray-900 text-white">Search</button>
        </form>

        {/* Sorting / Limit */}
        <div className="flex flex-wrap gap-2 md:justify-end">
          <select value={sort} onChange={onSortChange} className="px-3 py-2 rounded-lg border">
            {SORT_FIELDS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select value={order} onChange={onOrderChange} className="px-3 py-2 rounded-lg border">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>

          <select value={limit} onChange={onLimitChange} className="px-3 py-2 rounded-lg border">
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* 👆 Top pagination */}
      <Pagination />

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 p-3">
          {error?.response?.data?.message || "Failed to load venues"}
          <button onClick={() => refetch()} className="underline ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading &&
          pageRows.length === 0 &&
          Array.from({ length: 6 }).map((_, i) => (
            <li key={`sk-${i}`} className="rounded-xl border p-4 animate-pulse">
              <div className="aspect-[16/10] rounded-lg bg-gray-200 mb-3" />
              <div className="h-4 w-2/3 bg-gray-200 mb-2 rounded" />
              <div className="h-3 w-full bg-gray-200 mb-2 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </li>
          ))}

        {pageRows.map((v, i) => {
          const isAboveFold = i < 6; // prioritize first 6 images (adjust to taste)

          return (
            <li
              key={`v-${v?.id || "noid"}-${i}`}
              className="rounded-xl border p-4 hover:shadow-sm transition"
            >
              <Link to={`/venues/${v.id}`} className="block">
                <div className="aspect-[16/10] overflow-hidden rounded-lg bg-gray-100 mb-3">
                  {v?.media?.[0]?.url ? (
                    <img
                      src={v.media[0].url}
                      srcSet={`
    ${v.media[0].url}?w=400 400w,
    ${v.media[0].url}?w=800 800w,
    ${v.media[0].url}?w=1200 1200w
  `}
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      alt={v.media[0].alt || v.name}
                      className="w-full h-full object-cover"
                      width="800"
                      height="500"
                      loading={isAboveFold ? "eager" : "lazy"}
                      fetchPriority={isAboveFold ? "high" : "low"}
                      decoding="async"
                      onError={(e) => {
                        const img = e.currentTarget;
                        // swap to fallback once
                        if (img.src !== IMG_FALLBACK) {
                          img.src = IMG_FALLBACK;
                          img.removeAttribute("srcset"); // stop responsive retries
                          img.fetchPriority = "low";
                        }
                      }}
                    />
                  ) : null}
                </div>

                <h3 className="name font-semibold truncate">{v?.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{v?.description}</p>

                <div className="mt-2 text-sm text-gray-700">
                  €{v?.price} · max {v?.maxGuests} guests
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* 👇 Bottom pagination */}
      <Pagination />

      {isFetching && !isLoading && <p className="text-center text-gray-500 mt-2">Loading…</p>}
    </div>
  );
}
