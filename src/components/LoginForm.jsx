/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.email || !form.password) {
      setFormError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    const res = await login(form);
    setSubmitting(false);
    if (res.ok) {
      const redirectTo = location.state?.from?.pathname || "/profile";
      navigate(redirectTo, { replace: true });
    } else {
      setFormError(res.error || "Login failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-4">
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
          autoComplete="current-password"
        />
      </div>

      {(formError || error) && <p className="text-red-600 text-sm">{formError || error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-green-600 text-white py-2 disabled:opacity-60"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
