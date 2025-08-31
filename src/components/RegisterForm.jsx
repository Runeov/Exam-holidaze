/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅
import { useAuth } from "../context/AuthContext";
import { showAlert } from "../helpers/AlarmWarnings.jsx";

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

  // --- Inline validation (same style as Login) ------------------------------
  const emailTrimmed = form.email.trim().toLowerCase();
  const isNoroffStudent = emailTrimmed.endsWith("@stud.noroff.no");
  const isPasswordLongEnough = (form.password || "").length >= 8;

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

    if (!form.name || !form.email || !form.password) {
      setFormError("All fields are required.");
      return;
    }
    if (!isNoroffStudent) {
      setFormError("Only @stud.noroff.no email addresses are allowed to register.");
      return;
    }
    if (!isPasswordLongEnough) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    const res = await register(form);
    setSubmitting(false);

    if (!res?.ok) {
      setFormError(res?.error || "Registration failed");
    } else {
      navigate("/profile");
    }
  }

  const showInlineError = (formError || error) && !(emailWarning || passwordWarning);

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
          required
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
          placeholder="you@stud.noroff.no"
          autoComplete="email"
          required
        />
        {emailWarning ? <p className="text-amber-600 text-xs mt-1">{emailWarning}</p> : null}
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
          minLength={8}
          required
        />
        {passwordWarning ? <p className="text-amber-600 text-xs mt-1">{passwordWarning}</p> : null}
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

      {showInlineError ? <p className="text-red-600 text-sm">{}</p> : null}

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
