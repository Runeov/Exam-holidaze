/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfileBookings } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import SearchBarDropdown from "./SearchBarDropdown"; // ✅ You requested this version

export default function NavbarWithSearch() {
  const { user, profile, token, isAuthed, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(undefined);
  const [tempDateRange, setTempDateRange] = useState(undefined);
  const [selectedPlace, setSelectedPlace] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 99999 });
  const [metaFilters, setMetaFilters] = useState({
    wifi: false,
    parking: false,
    breakfast: false,
    pets: false,
  });

  const loggedIn = typeof isAuthed === "boolean" ? isAuthed : Boolean(user || profile || token);
  const isManager = loggedIn && profile?.venueManager;
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  useEffect(() => {
    async function run() {
      if (!isAuthed || !profile?.name) return;
      try {
        setState((s) => ({ ...s, loading: true, error: "" }));
        const rows = await getProfileBookings(profile.name, { includeVenue: true, limit: 100 });
        setState({ loading: false, error: "", rows: Array.isArray(rows) ? rows : [] });
      } catch (err) {
        setState({ loading: false, error: err?.message || "Failed to load bookings", rows: [] });
      }
    }
    run();
  }, [isAuthed, profile?.name]);

  return (
    <nav
      className="w-full h-16 bg-[--color-surface] border-b border-[--color-ring] flex items-center justify-between shadow-sm"
      data-theme="light"
    >
      {/* Left: Logo flush left */}
      <div className="shrink-0 pl-2">
        <a href="/" className="block">
          <img
            src="/images/holidaze_navbar.png"
            alt="Holidaze Logo"
            className="h-16 -ml-4 object-cover"
          />
        </a>
      </div>

      {/* Center: SearchBarDropdown */}
      <div className="flex-1 max-w-3xl px-4">
        <SearchBarDropdown
          selected={tempDateRange}
          onChange={setTempDateRange}
          onApply={setSelectedDateRange}
          onPriceRangeChange={setPriceRange}
          onMetaFilterChange={setMetaFilters}
          onLocationChange={setSelectedPlace}
          selectedPlace={selectedPlace}
          selectedDateRange={selectedDateRange}
          minDate={new Date()}
        />
      </div>

      {/* Right: Hamburger Toggle */}
      <div className="shrink-0 flex items-center">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 ring-[color:var(--color-brand-500)] border border-[color:var(--color-brand-500)] text-[color:var(--color-brand-500)] hover:bg-[color:var(--color-accent-50)] active:scale-[0.98]"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            // X Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
