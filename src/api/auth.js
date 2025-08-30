import { http } from "./http.js";
import { readSession, writeSession, clearSession } from "../utils/session.js";

// POST /auth/register
export async function register({ email, password, name, venueManager = false }) {
  const payload = { email, password, name };
  if (venueManager) payload.venueManager = true;
  const { data } = await http.post("/auth/register", payload);
  return data;
}

// POST /auth/login  -> writes session + ensures API key
export async function login({ email, password }) {
  const { data } = await http.post("/auth/login", { email, password });

  // API shape guard
  const token = data?.data?.accessToken || data?.accessToken;
  const profile = data?.data || data;
  if (!token) throw new Error("Missing access token from API response.");

  // Save token + profile now
  writeSession({ token, profile });

  // Ensure API key exists
  let { apiKey } = readSession();
  if (!apiKey) {
    const resp = await http.post("/auth/create-api-key", { name: "holidaze-key" });
    apiKey = resp?.data?.data?.key || resp?.data?.key || resp?.data;
    if (!apiKey) throw new Error("API key missing in response.");
    writeSession({ apiKey });
  }

  return { token, profile, apiKey };
}

export function logout() {
  clearSession();
}

// ✅ Canonical headers for Noroff v2
export function getAuthHeaders(extra = {}) {
  const { token, apiKey } = readSession();
  if (!token || !apiKey) {
    console.error("❌ Missing authentication details.", { hasToken: !!token, hasKey: !!apiKey });
    return null;
  }
  return {
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": apiKey,
    "Content-Type": "application/json",
    ...extra,
  };
}
