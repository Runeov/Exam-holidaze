const KEY = "holidaze:session";

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
export function writeSession(next) {
  const cur = readSession();
  const merged = { ...cur, ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
export function clearSession() {
  localStorage.removeItem(KEY);
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
