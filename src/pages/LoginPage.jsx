import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Log in</h1>
      <LoginForm />
      <p className="mt-4 text-sm">
        New here?{" "}
        <Link to="/register" className="text-blue-600 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
