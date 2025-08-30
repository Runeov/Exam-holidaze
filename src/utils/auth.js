// src/utils/auth.js
const BASE_URL = "https://v2.api.noroff.dev";

// ---- Storage helpers (simple + noisy for debugging) ----
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`[auth:storage] saved ${key}`, value);
  } catch (err) {
    console.error(`[auth:storage] save error for ${key}`, err);
  }
}
function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    console.log(`[auth:storage] get ${key}`, parsed);
    return parsed;
  } catch (err) {
    console.error(`[auth:storage] get error for ${key}`, err);
    return fallback;
  }
}
function remove(key) {
  try {
    localStorage.removeItem(key);
    console.log(`[auth:storage] removed ${key}`);
  } catch (err) {
    console.error(`[auth:storage] remove error for ${key}`, err);
  }
}

// ---- Public helpers you can import app-wide ----
export function readSession() {
  const token = get("token", "");
  const apiKey = get("apiKey", "");
  const profile = get("profile", null);
  return { token, apiKey, profile };
}

export function getAuthHeaders(extra = {}) {
  const { token, apiKey } = readSession();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
    ...extra,
  };
  console.log("[auth] getAuthHeaders ->", headers);
  return headers;
}

export function logoutUser() {
  console.log("[auth] logoutUser()");
  remove("token");
  remove("apiKey");
  remove("profile");
}

// ---- Network functions (fetch) ----
export async function registerUser({ name, email, password, venueManager = false }) {
  console.log("[auth] registerUser payload", { name, email, venueManager });
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      ...(venueManager ? { venueManager: true } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[auth] registerUser failed", res.status, data);
    throw new Error(data?.errors?.[0]?.message || "Registration failed");
  }
  console.log("[auth] registerUser ok", data);
  return data;
}

export async function loginUser({ email, password }) {
  console.log("[auth] loginUser payload", { email });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[auth] loginUser failed", res.status, data);
    throw new Error(data?.errors?.[0]?.message || "Login failed");
  }

  // API variants: sometimes data is in data.data, sometimes top-level
  const token = data?.data?.accessToken || data?.accessToken;
  const profile = data?.data || data;
  if (!token) {
    console.error("[auth] loginUser: missing token in response", data);
    throw new Error("Missing access token from API response.");
  }

  // Save what we have immediately
  save("token", token);
  save("profile", profile);

  // Ensure API key exists (create if missing)
  let apiKey = get("apiKey", "");
  if (!apiKey) {
    apiKey = await createApiKey();
    save("apiKey", apiKey);
  }

  console.log("[auth] loginUser ok (token & apiKey ready)", {
    hasToken: !!token,
    hasKey: !!apiKey,
  });
  return { token, profile, apiKey };
}

export async function createApiKey() {
  const { token } = readSession();
  if (!token) throw new Error("No token found for creating API key.");

  console.log("[auth] createApiKey()");
  const res = await fetch(`${BASE_URL}/auth/create-api-key`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "holidaze-key" }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[auth] createApiKey failed", res.status, data);
    throw new Error(data?.errors?.[0]?.message || "Failed to create API key");
  }
  const key = data?.data?.key || data?.key;
  if (!key) throw new Error("API key missing in response.");
  console.log("[auth] createApiKey ok");
  return key;
}
