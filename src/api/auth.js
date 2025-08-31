// src/api/auth.js

import { showAlert } from "../helpers/AlarmWarnings.jsx";
import { clearSession, readSession, writeSession } from "../utils/session.js";
import { httpGet, httpPost } from "./http.js";

const BASE = "/auth";

/**
 * Register a new user
 */
export async function register({ email, password, name, venueManager = false }) {
  const payload = { email, password, name, ...(venueManager ? { venueManager: true } : {}) };
  const res = await httpPost(`${BASE}/register`, payload);

  return res?.data;
}

/**
 * Login then ensure an API key exists.
 * Returns { token, profile, apiKey }
 */
export async function login({ email, password }) {
  const res = await httpPost(`${BASE}/login`, { email, password }, { params: { _holidaze: true } });

  const body = res?.data;
  if (!res || typeof res.data !== "object") {
    showAlert();
  }

  // Normalize v2 shapes
  const token = body?.data?.accessToken ?? body?.accessToken;
  const profile = body?.data ?? body;
  if (!token) throw new Error("Missing access token from API response.");

  // Persist token + profile
  writeSession({ token, profile });

  // Ensure API key (MUST be POST on v2)
  let { apiKey } = readSession();
  if (!apiKey) {
    apiKey = await createApiKey({ token, name: "holidaze-key" });
    if (!apiKey) throw new Error("API key missing in response.");
    writeSession({ apiKey });
  }

  return { token, profile, apiKey };
}

/**
 * Create API key (POST /auth/create-api-key)
 * Accepts an existing bearer token and optional name.
 */
export async function createApiKey({ token, name = "app-key" }) {
  if (!token) throw new Error("createApiKey: token is required");
  const res = await httpPost(`${BASE}/create-api-key`, { name }, { token });
  return res?.data?.apiKey ?? res?.data?.data?.key ?? res?.data?.key;
}

/**
 * Clear session completely
 */
export function logout() {
  clearSession();
}

/**
 * Optional legacy helper (prefer passing { token, apiKey } to http.* instead)
 */
export function getAuthHeaders() {
  try {
    const s = readSession?.() || {};
    const headers = {};
    if (s.token) headers.Authorization = `Bearer ${s.token}`;
    if (s.apiKey) headers["X-Noroff-API-Key"] = s.apiKey;
    return headers;
  } catch {
    return {};
  }
}
