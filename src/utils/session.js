import { get, save, remove } from "./storage.js";

export function readSession() {
  return {
    token: get("token", ""),
    apiKey: get("apiKey", ""),
    profile: get("profile", null),
  };
}

export function writeSession({ token, apiKey, profile }) {
  if (token) save("token", token);
  if (apiKey) save("apiKey", apiKey);
  if (profile) save("profile", profile);
}

export function clearSession() {
  remove("token");
  remove("apiKey");
  remove("profile");
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
