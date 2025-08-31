// src/components/FeaturedVenues.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listVenues } from "../api/venues";
import VenueCard from "./VenueCard";

export default function FeaturedVenues() {
  const [venues, setVenues] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        setStatus("loading");

        // Fetch a small set of "featured" venues (e.g. top rated)
        const res = await listVenues({
          page: 1,
          limit: 3,
          sort: "rating",
          order: "desc",
          withOwner: true, // optional, if you want host info
        });

        const data = res?.data?.data || [];

        if (active) {
          setVenues(data);
          setStatus("idle");
        }
      } catch (e) {
        console.error("❌ featured fetch failed", e);
        if (active) setStatus("error");
      }
    }

    run();
    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <p className="text-sm opacity-75">Loading featured venues…</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-red-600">Couldn’t load featured venues. Try again later.</p>;
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-2xl md:text-3xl font-bold">Featured venues</h2>
        <Link to="/venues" className="text-sm font-semibold underline">
          View all
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((v) => (
          <VenueCard key={v.id} venue={v} />
        ))}
      </div>
    </div>
  );
}
