// src/components/NavbarWithSearch.jsx
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
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
  const menuButtonRef = useRef(null); // for outside-click
  const menuId = useId();
  const uid = useId();
  const priceMinId = `${uid}-price-min`;
  const priceMaxId = `${uid}-price-max`;

  // —— NEW: dynamic venues link/label
  const venuesLabel = loggedIn ? "My Venues" : "All Venues";
  const venuesHref = loggedIn ? "/my-venues" : "/venues";

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

  // Outside click + Esc to close menu
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      const menuEl = menuRef.current;
      const btnEl = menuButtonRef.current;
      if (!menuEl || !btnEl) return;
      const clickedInside = menuEl.contains(e.target) || btnEl.contains(e.target);
      if (!clickedInside) setMenuOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMenuOpen(false);

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
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

  const baseBtn =
    "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition shadow-sm px-5 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent-500)] active:scale-[0.98]";
  const brandBtn = `${baseBtn} bg-[color:var(--color-brand-500)] text-white hover:bg-[color:var(--color-accent-700)]`;
  const outlineBrandBtn = `${baseBtn} border border-[color:var(--color-brand-500)] text-[color:var(--color-brand-500)] hover:bg-[color:var(--color-accent-50)]`;
  const neutralBtn = `${baseBtn} border border-black/10 text-gray-700 hover:bg-black/[.03]`;
  const dangerBtn = `${baseBtn} bg-red-600 text-white hover:bg-red-700`;

  const unauthedMenu = (
    <div className="flex flex-col gap-2">
      <Link
        to={venuesHref}
        onClick={() => setMenuOpen(false)}
        className={`${outlineBrandBtn} w-full justify-center`}
      >
        {venuesLabel}
      </Link>
      <Link
        to="/login"
        onClick={() => setMenuOpen(false)}
        className={`${brandBtn} w-full justify-center`}
      >
        Log In
      </Link>
      <Link
        to="/register"
        onClick={() => setMenuOpen(false)}
        className="w-full justify-center inline-flex items-center font-medium rounded-[var(--radius-md)] transition shadow-sm px-5 py-2 text-sm bg-[color:var(--color-success-500)] text-[color:var(--color-white-true)] hover:bg-[color:var(--color-success-600)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-success-500)] active:scale-[0.98]"
      >
        Register
      </Link>
    </div>
  );

  const authedMenu = (
    <div className="flex flex-col gap-2">
      <Link
        to={venuesHref}
        onClick={() => setMenuOpen(false)}
        className={`${brandBtn} w-full justify-center`}
      >
        {venuesLabel}
      </Link>
      <Link
        to="/profile"
        onClick={() => setMenuOpen(false)}
        className={`${brandBtn} w-full justify-center`}
      >
        My Profile
      </Link>
      <button type="button" onClick={handleLogout} className={`${dangerBtn} w-full justify-center`}>
        Log Out
      </button>
    </div>
  );

  return (
    <nav
      className="
    sticky top-0 z-50 w-full h-16
    bg-[--color-surface] border-b border-[--color-ring]
    flex items-center px-4 shadow-sm
    bg-[linear-gradient(rgba(255,255,255,0.25),rgba(255,255,255,0.25)),url('/images/Clouds_navbar2.png')]
    bg-no-repeat bg-cover bg-center
  "
      data-theme="light"
    >
      <div className="shrink-0 transform -translate-x-4 -translate-y-px">
        <a href="/" className="block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500]">
          <img src="/images/holidaze_navbar.png" alt="Holidaze Logo" className="h-16 object-contain" />
        </a>
      </div>

      {/* Center: SearchBar (mobile + tablet inline) */}
      <div className="flex-1 max-w-3xl px-4 lg:hidden">
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

      {/* Desktop: centered search bar */}
      <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-4">
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
      <div className="relative shrink-0 flex items-center ml-auto">
        <button
          type="button"
          ref={menuButtonRef}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center font-medium w-10 h-10 p-0 rounded-[var(--radius-md)] transition shadow-sm text-sm text-[color:var(--color-brand-700)] bg-[color:var(--color-brand-50)] border border-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent-500)] active:scale-[0.98]"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls={menuId}
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" focusable="false">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" focusable="false">
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
            className="absolute right-0 top-[calc(100%+8px)] w-64 z-50 rounded-2xl border border-[--color-ring] bg-white/95 backdrop-blur-md shadow-lg p-3"
          >
            {loggedIn && (
              <div className="px-2 pb-2 mb-2 border-b border-black/10 text-sm text-slate-800">
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
