/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // ✅

export default function RegisterForm() {
  const { register, error } = useAuth();
  const navigate = useNavigate(); // ✅
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    venueManager: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function onChange(e) {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.email || !form.password) {
      setFormError("All fields are required.");
      return;
    }
    setSubmitting(true);
    const res = await register(form);
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || "Registration failed");
    } else {
      navigate("/profile");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="your_nickname"
          autoComplete="username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="venueManager"
          checked={form.venueManager}
          onChange={onChange}
        />
        Register as venue manager
      </label>

      {(formError || error) && <p className="text-red-600 text-sm">{formError || error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
