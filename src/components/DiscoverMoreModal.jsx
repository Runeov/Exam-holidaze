/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listVenues } from "../api/venues";

export default function DiscoverMoreModal({ onClose }) {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await listVenues({ page: 1, limit: 100 });
        const all = res?.data?.data || [];

        const countMap = {};
        all.forEach((v) => {
          const city = v?.location?.city?.trim() || "Unknown";
          countMap[city] = (countMap[city] || 0) + 1;
        });

        const sortedCities = Object.entries(countMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => {
            const venue = all.find((v) => (v.location?.city || "Unknown").trim() === name);
            return {
              name,
              count,
              img: venue?.media?.[0]?.url || "https://placehold.co/400x250?text=" + name,
            };
          });

        setCities(sortedCities);
      } catch (err) {
        console.error("Failed to load cities", err);
      }
    }

    load();
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-surface rounded-2xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Popular destinations</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-xl">
            ×
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {cities.map((c) => (
            <Link
              to={`/venues?q=${encodeURIComponent(c.name)}`}
              key={c.name}
              className="rounded-xl overflow-hidden bg-muted shadow hover:shadow-md transition group"
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
      </div>
    </div>
  );
}
