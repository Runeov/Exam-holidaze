import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-4">Loading…</p>;
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
