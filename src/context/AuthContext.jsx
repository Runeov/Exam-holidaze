// src/context/AuthProvider.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, register as apiRegister, fetchApiKey } from "../api/auth";
import { installInterceptors } from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    installInterceptors({
      getToken: () => token,
      getApiKey: () => apiKey,
      onUnauthorized: () => logout(),
    });
  }, [token, apiKey, logout]);

  useEffect(() => {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const { accessToken, user: u, apiKey: k } = JSON.parse(raw);
      setUser(u ?? null);
      setApiKey(k ?? null);
      setToken(accessToken ?? null);
    }
    setLoading(false);
  }, []);

  const doLogin = useCallback(async (email, password) => {
    const { accessToken, refreshToken, ...userInfo } = await apiLogin(email, password);
    const key = await fetchApiKey(accessToken);

    const auth = { accessToken, refreshToken, user: userInfo, apiKey: key };
    localStorage.setItem("auth", JSON.stringify(auth));

    setUser(userInfo);
    setApiKey(key);
    setToken(accessToken);
  }, []);

  const doRegister = useCallback(
    async (email, password, name, venueManager = false) => {
      await apiRegister(email, password, name, venueManager);
      return doLogin(email, password);
    },
    [doLogin],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("auth");
    setUser(null);
    setApiKey(null);
    setToken(null);
  }, []);

  const isAuthed = !!user;
  const value = useMemo(
    () => ({ user, apiKey, token, isAuthed, loading, doRegister, doLogin, logout }),
    [user, apiKey, token, loading, doRegister, doLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
