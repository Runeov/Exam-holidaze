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
    <nav className="fixed top-0 left-0 z-50 w-full bg-white border-b border-black/5">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/images/logo.light.png"
            alt="Holidaze"
            className="h-10 w-10 rounded-full object-cover dark:hidden"
          />
          <img
            src="/images/logo.dark.png"
            alt="Holidaze"
            className="h-20 w-20 rounded-full object-cover hidden dark:inline"
          />
        </Link>

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

        {/* Hamburger Toggle */}
        <div className="shrink-0">
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
      </div>

      {/* Slide-in menu */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <aside
            className="fixed right-0 top-0 z-50 w-[min(90vw,360px)] h-full bg-white shadow-xl p-6 border-l border-black/10 flex flex-col gap-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800">Menu</span>
              {/* Close button inside drawer */}
              <button
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:ring-offset-2 ring-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-error-700)] active:scale-[0.98]"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <ul className="flex flex-col gap-3 text-sm">
              {!loggedIn ? (
                <>
                  <li>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-center ring-[color:var(--color-accent-500)] bg-[color:var(--color-accent-500)] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent-700)] active:scale-[0.98]"
                    >
                      Log In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-center ring-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)] text-[color:var(--color-text)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]"
                    >
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/venues"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-center ring-[color:var(--color-accent-500)] border border-[color:var(--color-accent-500)] text-[color:var(--color-accent-500)] hover:bg-[color:var(--color-accent-50)] active:scale-[0.98]"
                    >
                      Explore Venues
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-center ring-[color:var(--color-brand-700)] bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]"
                    >
                      My Profile
                    </Link>
                  </li>

                  {isManager && (
                    <li>
                      <Link
                        to="/venues/create"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-md px-3 py-2 text-center ring-[color:var(--color-brand-700)] bg-[color:var(--color-accent-300)] text-[color:var(--color-text)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]"
                      >
                        Create Venue
                      </Link>
                    </li>
                  )}

                  {/* Logout pushed down and styled as danger */}
                  <li className="mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-md px-3 py-2 text-center ring-[color:var(--color-error-500)] bg-[color:var(--color-error-500)] text-[color:var(--color-text)] hover:bg-[color:var(--color-error-800)] active:scale-[0.98]"
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>

            <div className="mt-auto pt-4 text-xs text-gray-400">
              © {new Date().getFullYear()} Holidaze
            </div>
          </aside>
        </>
      )}
    </nav>
  );
}
