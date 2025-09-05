// src/components/NavbarWithSearch.jsx
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative icons */
/** biome-ignore-all lint/a11y/useButtonType: all buttons have explicit types */
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfileBookings } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import SearchBarDropdown from "./SearchBarDropdown";

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

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const menuId = useId();

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

  // Close menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      setMenuOpen(false);
      navigate("/");
    }
  };

  // Button class helpers – bring back your old styles
  const baseBtn =
    "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition shadow-sm px-5 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent-500)] active:scale-[0.98]";
  const brandBtn = `${baseBtn} bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent-700)]`;
  const outlineBrandBtn = `${baseBtn} border border-[color:var(--color-brand-500)] text-[color:var(--color-brand-500)] hover:bg-[color:var(--color-accent-50)]`;
  const neutralBtn = `${baseBtn} border border-black/10 text-gray-700 hover:bg-black/[.03]`;
  const dangerBtn = `${baseBtn} bg-red-600 text-white hover:bg-red-700`;

  // Menu items depending on auth
  const unauthedMenu = (
    <div className="space-y-2">
      <Link to="/venues" onClick={() => setMenuOpen(false)} className={outlineBrandBtn}>
        View Venues
      </Link>
      <Link to="/login" onClick={() => setMenuOpen(false)} className={brandBtn}>
        Log In
      </Link>
      <Link to="/register" onClick={() => setMenuOpen(false)} className={neutralBtn}>
        Register
      </Link>
    </div>
  );

  const authedMenu = (
    <div className="space-y-2">
      <Link to="/venues" onClick={() => setMenuOpen(false)} className={outlineBrandBtn}>
        Venues
      </Link>
      <Link
        to={profile?.name ? `/profiles/${encodeURIComponent(profile.name)}` : "/profile"}
        onClick={() => setMenuOpen(false)}
        className={neutralBtn}
      >
        My Profile
      </Link>
      <button type="button" onClick={handleLogout} className={dangerBtn}>
        Log Out
      </button>
    </div>
  );

  return (
    <nav
      className="sticky top-0 z-50 w-full h-16 bg-[--color-surface] border-b border-[--color-ring] flex items-center px-4 shadow-sm"
      data-theme="light"
    >
      <div className="shrink-0 transform -translate-x-4">
        <a href="/" className="block">
          <img
            src="/images/holidaze_navbar.png"
            alt="Holidaze Logo"
            className="h-16 object-contain"
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
      <div className="relative shrink-0 flex items-center">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 ring-[color:var(--color-brand-500)] border border-[color:var(--color-brand-500)] text-[color:var(--color-brand-500)] hover:bg-[color:var(--color-accent-50)] active:scale-[0.98]"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls={menuId}
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

        {menuOpen && (
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            aria-label="Main menu"
            className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-xl border border-[--color-ring] bg-[--color-surface] shadow-md p-3"
          >
            {/* Optional header when logged in */}
            {loggedIn && (
              <div className="px-2 pb-2 mb-2 border-b border-gray-200 text-sm text-gray-600">
                Signed in as <span className="font-medium">{profile?.name || user?.email}</span>
              </div>
            )}

            {loggedIn ? authedMenu : unauthedMenu}
          </div>
        )}
      </div>
    </nav>
  );
}
