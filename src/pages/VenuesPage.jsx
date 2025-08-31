// src/pages/VenuesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { listVenues } from "../api/venues";
import VenueCard from "../components/VenueCard";

const LIMIT_OPTIONS = [25, 50, 100];

export default function VenuesPage() {
  const [params, setParams] = useSearchParams();

  // URL → state (with sensible fallbacks)
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = LIMIT_OPTIONS.includes(Number(params.get("limit")))
    ? Number(params.get("limit"))
    : 25;
  const q = params.get("q") || "";

  // If your cards show host info, set this to true.
  const withOwner = true;

  const [state, setState] = useState({
    status: "idle", // idle | loading | error
    rows: [],
    meta: { total: 0, page, limit },
    error: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setState((s) => ({ ...s, status: "loading", error: null }));
        const res = await listVenues({
          page,
          limit,
          q: q || undefined,
          sort: "created",
          order: "desc",
          withOwner,
        });
        const data = res?.data?.data || [];
        const meta = res?.data?.meta || { total: data.length, page, limit };
        if (!alive) return;
        setState({ status: "idle", rows: data, meta, error: null });
      } catch (err) {
        if (!alive) return;
        setState((s) => ({
          ...s,
          status: "error",
          error:
            err?.response?.data?.errors?.[0]?.message || err?.message || "Failed to load venues",
        }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, limit, q]); // ← list primitives

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value === undefined || value === "" || value === null) next.delete(key);
    else next.set(key, String(value));
    // reset to page 1 when changing filters other than page
    if (key !== "page") next.set("page", "1");
    setParams(next, { replace: true });
  }

  function onSubmitSearch(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateParam("q", form.get("q")?.toString().trim() || "");
  }

  const { status, rows, meta, error } = state;
  const totalPages = Math.max(1, Math.ceil((meta?.total || 0) / limit));

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">All Venues</h1>
        <p className="text-gray-600">Browse stays. Use the search to narrow things down.</p>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <form onSubmit={onSubmitSearch} className="flex gap-2 w-full md:max-w-lg">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, city, country…"
            className="flex-1 rounded border px-3 py-2"
          />
          <button type="submit" className="px-4 py-2 rounded bg-gray-900 text-white font-semibold">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <label className="text-sm">
            <span className="mr-2">Results per page</span>
            <select
              value={limit}
              onChange={(e) => updateParam("limit", Number(e.target.value))}
              className="rounded border px-2 py-1"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Status */}
      {status === "loading" && <p className="opacity-75">Loading venues…</p>}
      {status === "error" && (
        <p className="text-red-600">{error || "Something went wrong loading venues."}</p>
      )}

      {/* Results */}
      {status !== "loading" && rows.length === 0 && (
        <div className="rounded-xl border p-6 text-center text-gray-600">
          <p className="mb-2">No venues found.</p>
          {q && (
            <button
              type="button"
              className="underline text-sm"
              onClick={() => updateParam("q", "")}
            >
              Clear search
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((v) => (
          <VenueCard key={v.id} venue={v} />
        ))}
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => updateParam("page", Math.max(1, page - 1))}
            className="px-3 py-2 rounded border disabled:opacity-50"
          >
            ← Prev
          </button>

          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => updateParam("page", page + 1)}
            className="px-3 py-2 rounded border disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* Back to home (optional) */}
      <div className="pt-6">
        <Link to="/" className="text-sm underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
