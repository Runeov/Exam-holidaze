/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    const res = await login(form);
    setSubmitting(false);

    if (res.ok) {
      const redirectTo = location.state?.from?.pathname || "/profile";
      navigate(redirectTo, { replace: true });
    } else {
      // ✅ Handle specific 401 Unauthorized response
      if (res.status === 401) {
        setFormError("Invalid credentials. Please check your email and password.");
      } else {
        setFormError(res.error || "Login failed");
      }
    }
  }

  const showInlineError = (formError || error) && !(emailWarning || passwordWarning);

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
        {passwordWarning && <p className="text-amber-600 text-xs mt-1">{passwordWarning}</p>}
      </div>

      {showInlineError && <p className="text-red-600 text-sm">{formError || error}</p>}

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
