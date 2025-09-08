// src/pages/LoginPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-[--color-text]">Log in</h1>

        <LoginForm
          buttonClassName="w-full rounded-md px-4 py-2 text-white font-medium
                           bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-700)]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--color-brand-600)]
                           disabled:opacity-60"
        />

        <p className="text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/register" className="underline text-blue-700">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
