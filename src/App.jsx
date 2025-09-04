// src/App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
// ✅ Import background from src/assets/images
import holidazeBg from "./assets/images/holidaze_bg_example_new.png";
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

        {/* ✅ Background applied here (kept your classes intact) */}
        <div
          className="bg-brand-50/40 min-h[100dvh] pt-24 sm:pt-28 pace-y-0 bg-cover bg-center bg-no-repeat"
          style={{
            // Optional: add a subtle overlay by stacking a gradient first
            backgroundImage: `linear-gradient(rgba(16,17,23,0.08), rgba(16,17,23,0.08))`,
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
