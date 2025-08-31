// src/pages/RegisterPage.jsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in (after successful register), go to profile
  useEffect(() => {
    if (user) navigate("/profile", { replace: true });
  }, [user, navigate]);

  return (
    <main className="px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Create your account</h1>
      <RegisterForm />
      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
