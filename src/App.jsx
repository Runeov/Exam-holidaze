// src/App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
// ✅ Import background from src/assets/images

import NavbarWithSearch from "./components/NavbarWithSearch";
import { useAuth } from "./context/AuthContext";
import CreateVenuePage from "./pages/CreateVenuePage";

import MyVenuesPage from "./pages/MyVenuesPage";
import ProfilePage from "./pages/ProfilePage";

import UserProfilePage from "./pages/UserProfilePage";
import VenueDetailsPage from "./pages/VenueDetailsPage";
import VenuesPage from "./pages/VenuesPage";
import StyleGuidePage from "./styles/StyleGuidePage";
import DebugSearchPage from "./test/DebugSearchPage";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));

// Small guard for future protected routes
function ProtectedRoute({ children }) {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-4">Loading…</p>;
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;

  return (
    <BrowserRouter>
      <nav className="p-4 space-x-4 bg-gray-100">
        <Link to="/">Home</Link>
        {!user && (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Log In</Link>
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
            <Route path="/" element={<HomePage />} />
          </>
        )}
        {user && <Link to="/venues">Browse Venues</Link>}
      </nav>

      <Suspense fallback={<p className="p-4">Loading page…</p>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Example for later:
          <Route path="/venues" element={<ProtectedRoute><VenuesPage/></ProtectedRoute>} /> */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
