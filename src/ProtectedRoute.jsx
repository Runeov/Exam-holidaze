import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function ProtectedRoute() {
  const { loading, isAuthed, token, profile } = useAuth();
  const location = useLocation();

  // Avoid any navigation while hydrating from storage
  if (loading) return null;

  // Normalize the authed flag in case your context doesn't expose isAuthed
  const authed = typeof isAuthed === "boolean" ? isAuthed : Boolean(token || profile);

  return authed ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
