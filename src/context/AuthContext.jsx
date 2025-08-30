// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readSession } from "../utils/session";
import { register as apiRegister, login as apiLogin, logout as apiLogout } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hydrate once from localStorage on mount
  useEffect(() => {
    const { token: t, apiKey: k, profile: p } = readSession();
    console.log("[Auth] hydrate", { hasToken: !!t, hasKey: !!k, hasProfile: !!p });
    setToken(t || "");
    setApiKey(k || "");
    setProfile(p || null);
    setLoading(false);
  }, []);

  async function handleRegister({ name, email, password, venueManager = false }) {
    setError("");
    try {
      console.log("[Auth] register()", { email, venueManager });
      await apiRegister({ name, email, password, venueManager });
      // DX: auto-login after successful register
      const res = await handleLogin({ email, password });
      return res.ok ? res : { ok: false, error: "Auto-login failed" };
    } catch (e) {
      console.error("[Auth] register error", e);
      setError(e.message);
      return { ok: false, error: e.message };
    }
  }

  async function handleLogin({ email, password }) {
    setError("");
    try {
      console.log("[Auth] login()", { email });
      const { token: t, apiKey: k, profile: p } = await apiLogin({ email, password });
      setToken(t);
      setApiKey(k);
      setProfile(p);
      return { ok: true, token: t, apiKey: k, profile: p };
    } catch (e) {
      console.error("[Auth] login error", e);
      setError(e.message);
      return { ok: false, error: e.message };
    }
  }

  function handleLogout() {
    console.log("[Auth] logout()");
    apiLogout();
    setToken("");
    setApiKey("");
    setProfile(null);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: provider value should only update when its deps change
  const value = useMemo(
    () => ({
      token,
      apiKey,
      profile,
      loading,
      error,
      isAuthed: Boolean(token),
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
