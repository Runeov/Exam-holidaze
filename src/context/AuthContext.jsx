import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, logout as apiLogout, register as apiRegister } from "../api/auth";
import { readSession } from "../utils/session";
import ThemeToggle from "./ThemeToggle";

const AuthContext = createContext(
  // inside AuthContext
  function applyProfile(next) {
    setUser((u) => ({ ...u, ...next }));
    const raw = localStorage.getItem("holidaze:session");
    const cur = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      "holidaze:session",
      JSON.stringify({
        ...cur,
        profile: { ...(cur.profile || {}), ...next },
        user: { ...(cur.user || {}), ...next },
      }),
    );
  },
);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hydrate once from localStorage on mount
  useEffect(() => {
    const { token: t, apiKey: k, profile: p } = readSession();
    setToken(t || "");
    setApiKey(k || "");
    setProfile(p || null);
    setLoading(false);
  }, []);

  async function handleRegister({ name, email, password, venueManager = false }) {
    setError("");
    try {
      await apiRegister({ name, email, password, venueManager });
      // Auto-login after register
      const res = await handleLogin({ email, password });
      return res.ok ? res : { ok: false, error: "Auto-login failed" };
    } catch (e) {
      setError(e.message);
      return { ok: false, error: e.message };
    }
  }

  async function handleLogin({ email, password }) {
    setError("");
    try {
      const { token: t, apiKey: k, profile: p } = await apiLogin({ email, password });
      setToken(t);
      setApiKey(k);
      setProfile(p);
      return { ok: true, token: t, apiKey: k, profile: p };
    } catch (e) {
      setError(e.message);
      return { ok: false, error: e.message };
    }
  }

  function handleLogout() {
    apiLogout();
    setToken("");
    setApiKey("");
    setProfile(null);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const value = useMemo(
    () => ({
      token,
      apiKey,
      profile,
      loading,
      error,
      isAuthed: Boolean(token && apiKey), // ✅ reliable flag
      register: handleRegister,
      login: handleLogin,
      logout: handleLogout,
    }),
    [token, apiKey, profile, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
