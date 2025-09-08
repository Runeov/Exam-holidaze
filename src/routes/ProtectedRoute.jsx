import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function ProtectedRoute({ children }) {
const { isAuthed } = useAuth();
const location = useLocation();


if (!isAuthed) {
const next = encodeURIComponent(location.pathname + location.search);
return <Navigate to={`/login?next=${next}`} replace />;
}
return children;
}