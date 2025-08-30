import React, { useId, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const formId = useId();
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState(1);
  const navigate = useNavigate(); // ✅ real router navigation

  function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (guests) params.set("guests", guests);
    const url = `/venues?${params.toString()}`;
    navigate(url); // ✅ go to /venues
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white rounded-2xl p-4 shadow"
    >
      <input
        type="text"
        placeholder="City, region or venue name"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="col-span-3 rounded-xl border border-gray-300 px-4 py-3"
      />
      <input
        type="number"
        min={1}
        value={guests}
        onChange={(e) => {
          const v = Number(e.target.value || 1);
          setGuests(v);
        }}
        className="col-span-1 rounded-xl border border-gray-300 px-4 py-3"
        placeholder="Guests"
      />
      <button
        type="submit"
        className="col-span-1 rounded-xl bg-gray-900 text-white px-4 py-3 font-semibold"
      >
        Search
      </button>
    </form>
  );
}
