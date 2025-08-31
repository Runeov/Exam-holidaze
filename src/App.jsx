// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import VenuesPage from "./pages/VenuesPage";
import VenueDetailsPage from "./pages/VenueDetailsPage";
import NavBar from "./components/NavBar";
import MyVenuesPage from "./pages/MyVenuesPage";
import CreateVenuePage from "./pages/CreateVenuePage";
import UserProfilePage from "./pages/UserProfilePage";

export default function App() {
  const { loading } = useAuth(); // `isAuthed` isn't in context; navbar uses `user`

  if (loading) return <p>Loading…</p>;

  return (
    <BrowserRouter>
      <NavBar />
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailsPage />} />
          <Route path="/venues/create" element={<CreateVenuePage />} />
          <Route path="/users/:name" element={<UserProfilePage />} />

          <Route path="/my-venues" element={<MyVenuesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
