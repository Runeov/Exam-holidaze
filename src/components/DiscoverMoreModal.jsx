/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listVenues } from "../api/venues";

// Small helper so mixed protocols/relative urls don't break images
function normalizeUrl(u) {
  if (!u) return "";
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (
    typeof window !== "undefined" &&
    window.location?.protocol === "https:" &&
    s.startsWith("http:")
  ) {
    s = s.replace(/^http:/i, "https:");
  }
  return s;
}

export default function DiscoverMoreModal({ onClose }) {
  const [cities, setCities] = useState([]);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        // Grab a decent slice to compute “popular”
        const res = await listVenues({ page: 1, limit: 100, sort: "rating", order: "desc" });
        const all = res?.data?.data || [];

        // Build a frequency map, case-insensitive, but preserve display name
        const freq = new Map(); // key: lowerCity, value: { name, count, img }
        for (const v of all) {
          const raw = v?.location?.city?.trim();
          const display = raw && raw.length ? raw : "Unknown";
          const key = display.toLowerCase();
          const entry = freq.get(key) || { name: display, count: 0, img: "" };
          entry.count += 1;

          // Pick a representative image if we don't have one yet
          const mediaUrl =
            v?.media?.[0]?.url ||
            v?.media?.[0]?.src ||
            v?.coverUrl ||
            (display ? `https://placehold.co/640x400?text=${encodeURIComponent(display)}` : "");
          if (!entry.img && mediaUrl) entry.img = normalizeUrl(mediaUrl);

          freq.set(key, entry);
        }

        // Top 6 looks nice in a 3-column layout; tweak as you wish
        const sorted = [...freq.values()].sort((a, b) => b.count - a.count).slice(0, 6);
        setCities(sorted);
      } catch (err) {
        console.error("DiscoverMoreModal: failed to load cities", err);
      }
    }
    load();
  }, []);

  // Focus the close button on mount for better a11y
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Close on Escape and on backdrop click
  const onKeyDown = (e) => {
    if (e.key === "Escape") onClose?.();
  };

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onBackdrop}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discover-title"
    >
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl border border-black/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h2 id="discover-title" className="text-lg md:text-xl font-semibold text-brand-700">
            Popular destinations
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-brand-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 md:p-6">
          {cities.length === 0 ? (
            <div className="text-center text-text-muted py-10">Loading destinations…</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {cities.map((c) => (
                <Link
                  to={`/venues?q=${encodeURIComponent(c.name)}`}
                  key={c.name}
                  className="group rounded-xl overflow-hidden bg-white border border-black/10 shadow-sm hover:shadow-md transition"
                  onClick={onClose}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={c.img}
                      alt={c.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-text">{c.name}</h3>
                    <p className="text-sm text-text-muted">{c.count} listings</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-black/10 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-black/[.03] focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
