import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function CenteredSearchBar() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location.trim()) params.set("place", location.trim());
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    if (guests > 0) params.set("guests", guests);

    navigate(`/venues?${params.toString()}`);
  };

  return (
    <div
      role="search"
      aria-label="Main search"
      className="w-full max-w-3xl mx-auto bg-white rounded-full shadow-sm border border-gray-300 flex items-center px-2 py-2 gap-2"
    >
      {/* Location */}
      <input
        type="text"
        placeholder="Where to?"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="flex-1 min-w-0 px-4 py-2 text-sm focus:outline-none"
      />

      {/* From */}
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="px-3 py-2 text-sm border-l border-gray-200 focus:outline-none"
      />

      {/* To */}
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="px-3 py-2 text-sm border-l border-gray-200 focus:outline-none"
      />

      {/* Guests */}
      <input
        type="number"
        min={1}
        max={10}
        value={guests}
        onChange={(e) => setGuests(e.target.value)}
        className="w-16 px-3 py-2 text-sm text-center border-l border-gray-200 focus:outline-none"
        aria-label="Number of guests"
      />

      {/* Search button */}
      <button
        type="button"
        onClick={handleSearch}
        className="ml-2 h-10 w-10 rounded-full bg-[color:var(--color-brand-600)] text-white grid place-items-center hover:bg-[color:var(--color-brand-700)] focus:outline-none focus-visible:ring-2"
      >
        <FaSearch size={14} />
      </button>
    </div>
  );
}
