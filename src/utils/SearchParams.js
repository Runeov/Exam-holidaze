// src/utils/SearchParams.js
// Single canonical module for encoding/decoding search filters and mapping to API params.

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { listVenues } from "../api/venues";

// Date helpers
export function toYMD(d) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (!(dt instanceof Date) || Number.isNaN(+dt)) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function fromYMD(s) {
  if (!s) return undefined;
  const dt = new Date(`${s}T00:00:00`);
  return Number.isNaN(+dt) ? undefined : dt;
}

// Build query string that works with VenuesPage (place, min, max, features) and newer pages (q, minPrice, maxPrice, flags)
export function encodeSearchParams({ selectedPlace, selectedDateRange, priceRange, metaFilters } = {}) {
  const params = new URLSearchParams();

  const place = (selectedPlace || "").trim();
  if (place) {
    params.set("place", place); // VenuesPage uses this
    params.set("q", place);     // also keep q for global search
  }

  const from = selectedDateRange?.from ? toYMD(selectedDateRange.from) : "";
  const to = selectedDateRange?.to ? toYMD(selectedDateRange.to) : "";
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const minPrice = Number.isFinite(priceRange?.min) ? Number(priceRange.min) : undefined;
  const maxPrice = Number.isFinite(priceRange?.max) ? Number(priceRange.max) : undefined;
  if (typeof minPrice === "number") {
    params.set("min", String(minPrice));      // VenuesPage expects min
    params.set("minPrice", String(minPrice)); // compatibility
  }
  if (typeof maxPrice === "number") {
    params.set("max", String(maxPrice));
    params.set("maxPrice", String(maxPrice));
  }

  const featuresObj = metaFilters || {};
  const featuresList = ["wifi", "parking", "breakfast", "pets"].filter((k) => !!featuresObj[k]);
  if (featuresList.length > 0) {
    // CSV survives Object.fromEntries(get) on VenuesPage
    params.set("features", featuresList.join(","));
    // Also add individual flags for any pages that read them
    featuresList.forEach((k) => params.set(k, "1"));
  }

  return params.toString();
}

// Decode current URL → normalized filters
export function decodeSearchParams(search) {
  const sp = new URLSearchParams(typeof search === "string" ? search : "");
  const getBool = (k) => {
    const v = (sp.get(k) || "").toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  };
  const getInt = (k, def) => {
    const v = Number(sp.get(k));
    return Number.isFinite(v) ? v : def;
  };

  const q = (sp.get("q") || sp.get("place") || "").trim();
  const from = fromYMD(sp.get("from"));
  const to = fromYMD(sp.get("to"));
  const min = getInt("min", getInt("minPrice", undefined));
  const max = getInt("max", getInt("maxPrice", undefined));

  const featureCsv = (sp.get("features") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const flagFeatures = ["wifi", "parking", "breakfast", "pets"].filter((k) => getBool(k));
  const features = Array.from(new Set([...featureCsv, ...flagFeatures]));

  return { q, from, to, min, max, features };
}

// Map decoded filters → API params (plus common aliases)
export function toApiQuery(decoded, overrides = {}) {
  const base = {
    q: decoded.q || undefined,
    from: decoded.from ? toYMD(decoded.from) : undefined,
    to: decoded.to ? toYMD(decoded.to) : undefined,
    minPrice: Number.isFinite(decoded.min) ? decoded.min : undefined,
    maxPrice: Number.isFinite(decoded.max) ? decoded.max : undefined,
    features: decoded.features?.length ? decoded.features.join(",") : undefined,
    // individual flags too
    wifi: decoded.features?.includes("wifi") ? 1 : undefined,
    parking: decoded.features?.includes("parking") ? 1 : undefined,
    breakfast: decoded.features?.includes("breakfast") ? 1 : undefined,
    pets: decoded.features?.includes("pets") ? 1 : undefined,
  };

  const aliases = {
    min: base.minPrice,
    max: base.maxPrice,
    priceMin: base.minPrice,
    priceMax: base.maxPrice,
    checkIn: base.from,
    checkOut: base.to,
    hasWifi: base.wifi ? true : undefined,
    hasParking: base.parking ? true : undefined,
    includesBreakfast: base.breakfast ? true : undefined,
    petFriendly: base.pets ? true : undefined,
  };

  const out = { ...base, ...aliases, ...overrides };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
}

// Optional hook to auto-load venues based on URL
export function useSearchAndLoadVenues({ page = 1, limit = 50, sort = "rating", order = "desc", withOwner = false } = {}) {
  const { search } = useLocation();
  const decoded = useMemo(() => decodeSearchParams(search), [search]);
  const [state, setState] = useState({ loading: true, error: "", rows: [], hasMore: true });

  useEffect(() => {
    let abort = false;
    async function run() {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const params = toApiQuery(decoded, { page, limit, sort, order, withOwner });
        const res = await listVenues(params);
        const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res) ? res : [];
        const hasMore = (Array.isArray(data) && data.length >= limit) || false;
        if (!abort) setState({ loading: false, error: "", rows: data, hasMore });
      } catch (err) {
        if (!abort) setState({ loading: false, error: err?.message || "Failed to load", rows: [], hasMore: false });
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [decoded.q, decoded.from, decoded.to, decoded.min, decoded.max, decoded.features?.join(","), page, limit, sort, order, withOwner]);

  return { ...state, filters: decoded };
}

// Merge helper for existing pages
export function mergeSearchIntoParams(search, baseParams = {}) {
  const decoded = decodeSearchParams(search || "");
  return toApiQuery(decoded, baseParams);
}

export default { encodeSearchParams, decodeSearchParams, toApiQuery, useSearchAndLoadVenues, mergeSearchIntoParams, toYMD, fromYMD };
