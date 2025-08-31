import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
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
