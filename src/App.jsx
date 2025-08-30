// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import NavBar from "./components/NavBar";

import HomePage from "./pages/HomePage";
import VenuesPage from "./pages/VenuesPage";
import VenueDetailsPage from "./pages/VenueDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// These live at src/ (root)
import ProfilePage from "./ProfilePage";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  const { loading } = useAuth();

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <BrowserRouter>
      <NavBar />

      <div className="mt-6">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div style={{ padding: 16 }}>Not Found</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
