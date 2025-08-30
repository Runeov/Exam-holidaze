// src/pages/VenuesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllVenues } from "../lib/api";
import VenueCard from "../components/VenueCard";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const PER_PAGE_OPTIONS = [25, 50, 100];

export default function VenuesPage() {
  const qs = useQuery();
  const navigate = useNavigate();

  const q = (qs.get("q") || "").trim().toLowerCase();
  const guests = Number(qs.get("guests") || 0);
  const perPageUrl = Number(qs.get("perPage") || 25);
  const perPage = PER_PAGE_OPTIONS.includes(perPageUrl) ? perPageUrl : 25;
  const pageUrl = Number(qs.get("page") || 1);

  const [venues, setVenues] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    async function run() {
      try {
        setStatus("loading");
        const all = await getAllVenues({ perRequest: 100, maxPages: 200 }); // 🔥 fetch ALL
        console.log("📊 total venues fetched:", all.length);

        const filtered = all.filter((v) => {
          if (!q) return true;
          const name = (v?.name || "").toLowerCase();
          const city = (v?.location?.city || "").toLowerCase();
          const country = (v?.location?.country || "").toLowerCase();
          return name.includes(q) || city.includes(q) || country.includes(q);
        });

        // If later we have capacity/guests rules, add them here
        setVenues(filtered);
        setStatus("idle");
      } catch (e) {
        console.error("❌ venues fetch failed:", e);
        setStatus("error");
      }
    }
    run();
    // Note: fetching again when q/guests change is optional; we can
    // filter the already-fetched array without refetching. If you want
    // live refetch on q change, remove the deps and split out filtering.
  }, [q]);

  const total = venues.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = clamp(pageUrl, 1, totalPages);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const pageItems = venues.slice(start, end);

  function setParam(key, value) {
    const next = new URLSearchParams(qs);
    if (value === undefined || value === null || value === "") next.delete(key);
    else next.set(key, String(value));
    if (key === "perPage" || key === "q") next.set("page", "1");
    navigate(`/venues?${next.toString()}`, { replace: false });
  }

  function goToPage(nextPage) {
    const clamped = clamp(nextPage, 1, totalPages);
    setParam("page", clamped);
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">All Venues</h1>
        <p className="text-gray-600">
          {q ? `Filtering by “${q}”` : "Showing all"}
          {guests ? ` • Guests: ${guests}` : ""}
          {total ? ` • ${total} result${total === 1 ? "" : "s"}` : ""}
        </p>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="perPage" className="text-sm">
            Results per page
          </label>
          {/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
          <select
            id="perPage"
            value={perPage}
            onChange={(e) => {
              const v = Number(e.target.value);
              console.log("📑 perPage ->", v);
              setParam("perPage", v);
            }}
            className="rounded border border-gray-300 px-2 py-1"
          >
            {PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Prev
          </button>
          <span className="text-sm">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {status === "loading" && <p>Loading venues…</p>}
      {status === "error" && <p className="text-red-600">Couldn’t load venues right now.</p>}
      {status === "idle" && total === 0 && <p>No venues match your filters.</p>}

      {status === "idle" && total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      )}
    </div>
  );
}
