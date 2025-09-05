// src/App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
// ✅ Import background from src/assets/images

import NavbarWithSearch from "./components/NavbarWithSearch";
import { useAuth } from "./context/AuthContext";
import CreateVenuePage from "./pages/CreateVenuePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyVenuesPage from "./pages/MyVenuesPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import UserProfilePage from "./pages/UserProfilePage";
import VenueDetailsPage from "./pages/VenueDetailsPage";
import VenuesPage from "./pages/VenuesPage";
import StyleGuidePage from "./styles/StyleGuidePage";
import DebugSearchPage from "./test/DebugSearchPage";

export default function App() {
  const { loading } = useAuth();

  if (loading) return <p>Loading…</p>;

  return (
    <div className="data-theme_light">
      <BrowserRouter>
        <NavbarWithSearch />

        {/* ✅ Background wrapper (now properly wraps <main>) */}
        <div
          style={{
            backgroundImage: "url('/images/holidaze_clean_gradient_1920x1080.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <main className="mx-auto max-w-[var(--container-max)] min-h-screen pace pt-0 mt-0 pb-16 sm:pb-20">
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
              <Route path="/styleguide" element={<StyleGuidePage />} />
              <Route path="/DebugSearchPage" element={<DebugSearchPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}
