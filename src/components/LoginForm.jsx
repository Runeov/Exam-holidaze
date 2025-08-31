/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { showAlert } from "../helpers/AlarmWarnings.jsx";

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

  // --- Inline validation ------------------------------------------------
  const emailTrimmed = form.email.trim().toLowerCase();
  const isNoroffStudent = emailTrimmed.endsWith("@stud.noroff.no");
  const isPasswordLongEnough = form.password.length >= 8;

  const emailWarning = useMemo(() => {
    if (!form.email) return "";
    if (!isNoroffStudent) return "Only @stud.noroff.no email addresses are allowed.";
    return "";
  }, [form.email, isNoroffStudent]);

  const passwordWarning = useMemo(() => {
    if (!form.password) return "";
    if (!isPasswordLongEnough) return "Password must be at least 8 characters.";
    return "";
  }, [form.password, isPasswordLongEnough]);

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.email || !form.password) {
      setFormError("Email and password are required.");
      return;
    }
    if (!isNoroffStudent) {
      setFormError("Only @stud.noroff.no email addresses are allowed.");
      return;
    }
    if (!isPasswordLongEnough) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(form);
      setSubmitting(false);

      if (res?.ok) {
        const redirectTo = location.state?.from?.pathname || "/profile";
        navigate(redirectTo, { replace: true });
      } else {
        setFormError(res?.error || "Login failed");
      }
    } catch (err) {
      // ← catch thrown errors
      setSubmitting(false);
      setFormError(err?.message || "Login failed");
    }
  }

  const showInlineError = (formError || error) && !(emailWarning || passwordWarning);

  // --- Auto-dismiss the main alert after it’s shown ---------------------
  useEffect(() => {
    if (!showInlineError) return;
    const t = setTimeout(() => setFormError(""), 4000);
    return () => clearTimeout(t);
  }, [showInlineError]);

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
          placeholder="you@stud.noroff.no"
          autoComplete="email"
          required
        />
        {emailWarning && <p className="text-amber-600 text-xs mt-1">{emailWarning}</p>}
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
          required
        />
        {passwordWarning && <p className="text-amber-600 text-xs mt-1">{showAlert}</p>}
      </div>

      {showInlineError && (
        <div className="alert-error" role="alert" aria-live="polite">
          {formError || error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-label="Submit login form"
        className="w-full rounded bg-green-600 text-white py-2 disabled:opacity-60"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
