/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, profile, token, isAuthed, logout, loading } = useAuth();

  const loggedIn = typeof isAuthed === "boolean" ? isAuthed : Boolean(user || profile || token);
  const isManager = loggedIn && profile?.venueManager;

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white border-b">
      <Link to="/" className="text-lg font-bold">
        Holidaze
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/venues">Venues</Link>

        {isManager && (
          <Link
            to="/venues/create"
            className="px-3 py-1 rounded bg-green-600 text-white font-medium hover:bg-green-700"
          >
            Create Venue
          </Link>
        )}

        {loggedIn && !loading ? (
          <>
            <Link to="/profile" className="font-semibold">
              My Profile
            </Link>
            <button onClick={logout} type="button" className="text-red-600 hover:underline ml-2">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
            <Link to="/login" className="text-green-600 hover:underline">
              Log In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
