import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // ✅ use router link
import { getFeaturedVenues } from "../lib/api";
import VenueCard from "./VenueCard";

export default function FeaturedVenues() {
  const [venues, setVenues] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error

  useEffect(() => {
    async function run() {
      try {
        setStatus("loading");
        const data = await getFeaturedVenues();
        console.log("🌟 featured venues loaded:", data?.length);
        setVenues(data);
        setStatus("idle");
      } catch (e) {
        console.error("❌ featured fetch failed", e);
        setStatus("error");
      }
    }
    run();
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
        {/* ✅ View all goes to /venues */}
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
