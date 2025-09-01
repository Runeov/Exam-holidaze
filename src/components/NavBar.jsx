// src/components/NavBar.jsx
/** biome-ignore-all lint/suspicious/noAssignInExpressions: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  // ⬇️ keep your existing auth wiring & flags intact
  const { user, profile, token, isAuthed, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

  // compact nav search state
  const [q, setQ] = useState("");
  const navigate = useNavigate(); // same navigation pattern as SearchBar.jsx:contentReference[oaicite:3]{index=3}

  const loggedIn = typeof isAuthed === "boolean" ? isAuthed : Boolean(user || profile || token);
  const isManager = loggedIn && profile?.venueManager;

  function linkCls(isActive) {
    return [
      "block py-2 px-3 md:p-0",
      isActive ? "text-brand-500 font-semibold" : "text-text hover:text-brand-500",
    ].join(" ");
  }

  function onNavSearchSubmit(e) {
    e.preventDefault();
    const term = q.trim();
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    navigate(`/venues${params.toString() ? `?${params.toString()}` : ""}`);
    setOpen(false); // close mobile menu after searching
  }

  return (
    <nav className="bg-surface fixed top-0 start-0 z-20 w-full border-b border-black/5">
      {/* Wider container + comfy gutters (fallbacks if tokens not defined) */}
      <div className="mx-auto flex max-w-[var(--container-max,1750px)] items-center justify-between px-[var(--page-gutter,clamp(1rem,4vw,2.5rem))] py-4 sm:py-5">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-4">
          {/* Dark theme logo */}
          <img
            src="/images/logo.dark.png"
            alt="Holidaze"
            className="h-16 w-16 rounded-full dark:inline hidden object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          {/* Light theme logo */}
          <img
            src="/images/logo.light.png"
            alt="Holidaze"
            className="h-16 w-16 rounded-full dark:hidden object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </Link>

        {/* Desktop inline search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center px-6">
          <form onSubmit={onNavSearchSubmit} className="relative w-full max-w-xl">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search venues…"
              aria-label="Search venues"
              className="w-full rounded-xl border px-4 py-2.5 bg-surface text-text placeholder:text-text-muted focus:ring-2 ring-brand-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 h-9 rounded-lg px-3 text-sm font-semibold text-white bg-brand-500 hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
            >
              Search
            </button>
          </form>
        </div>

        {/* Right: CTA (desktop) + burger */}
        <div className="flex items-center gap-3 md:order-2">
          {/* CTA visible on desktop; on mobile, it's inside the hamburger menu */}
          {isManager ? (
            <Link
              to="/venues/create"
              className="hidden md:inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
            >
              Create venue
            </Link>
          ) : loggedIn ? (
            <Link
              to="/venues"
              className="hidden md:inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
            >
              Explore venues
            </Link>
          ) : (
            <Link
              to="/register"
              className="hidden md:inline-flex rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
            >
              Get started
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-text hover:bg-muted focus:outline-none focus:ring-2 ring-brand-500 md:hidden"
            aria-controls="navbar-sticky"
            aria-expanded={open ? "true" : "false"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M3 6h18M3 12h18M3 18h18"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible links + mobile search + mobile CTA */}
      <div
        id="navbar-sticky"
        className={`w-full border-t border-black/5 bg-surface md:border-0 md:bg-transparent ${
          open ? "" : "hidden"
        }`}
      >
        <div className="mx-auto max-w-[var(--container-max,1750px)] px-[var(--page-gutter,clamp(1rem,4vw,2.5rem))] py-4 md:py-0">
          {/* Mobile search (only shown when menu is open) */}
          <div className="md:hidden mb-3">
            <form onSubmit={onNavSearchSubmit} className="flex gap-2">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search venues…"
                aria-label="Search venues"
                className="flex-1 rounded-xl border px-3 py-2 bg-surface text-text placeholder:text-text-muted focus:ring-2 ring-brand-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
              >
                Search
              </button>
            </form>
          </div>

          {/* Links + actions */}
          <ul className="flex flex-col gap-1 rounded-lg border border-black/5 bg-surface p-4 font-medium md:flex-row md:items-center md:gap-10 md:border-0 md:bg-transparent md:p-0">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => linkCls(isActive)}
                aria-current="page"
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/venues" className={({ isActive }) => linkCls(isActive)}>
                Venues
              </NavLink>
            </li>

            {isManager && (
              <li className="md:hidden">
                <Link
                  to="/venues/create"
                  onClick={() => setOpen(false)}
                  className="inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
                >
                  Create venue
                </Link>
              </li>
            )}

            {!isManager && loggedIn && (
              <li className="md:hidden">
                <Link
                  to="/venues"
                  onClick={() => setOpen(false)}
                  className="inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
                >
                  Explore venues
                </Link>
              </li>
            )}

            {!loggedIn && (
              <li className="md:hidden">
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="inline-flex rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 ring-brand-500"
                >
                  Get started
                </Link>
              </li>
            )}

            {loggedIn && !loading ? (
              <>
                <li>
                  <NavLink to="/profile" className={({ isActive }) => linkCls(isActive)}>
                    My Profile
                  </NavLink>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="block w-full rounded-sm py-2 px-3 text-left text-error-500 hover:underline md:p-0"
                    aria-label="Log out"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="hidden md:block">
                  <NavLink to="/register" className={({ isActive }) => linkCls(isActive)}>
                    Register
                  </NavLink>
                </li>
                <li className="hidden md:block">
                  <NavLink to="/login" className={({ isActive }) => linkCls(isActive)}>
                    Log In
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
