// src/pages/RegisterPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-[--color-text]">Create account</h1>

        {/* If your RegisterForm renders its own error/success states, nothing else to add here */}
        <RegisterForm />

        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="underline text-blue-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
