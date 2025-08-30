/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, profile, token, isAuthed, logout, loading } = useAuth();

  // Normalize "logged in"
  const loggedIn = typeof isAuthed === "boolean" ? isAuthed : Boolean(user || profile || token);

  // Debug once to verify values
  console.log("[NavBar] auth snapshot", {
    hasUser: !!user,
    hasProfile: !!profile,
    hasToken: !!token,
    isAuthed,
  });

  return (
    <nav className="p-4 flex items-center gap-4 bg-gray-100">
      <Link to="/" className="text-blue-600 hover:underline">
        Home
      </Link>

      {!loggedIn && !loading && (
        <>
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
          <Link to="/login" className="text-green-600 hover:underline">
            Log In
          </Link>
        </>
      )}

      {loggedIn && (
        <>
          <Link to="/profile" className="text-purple-600 hover:underline">
            Profile
          </Link>
          <button onClick={logout} className="text-red-600 hover:underline ml-2">
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
