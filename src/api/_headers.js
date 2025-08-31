export function getAuthHeaders(extra = {}) {
  try {
    const raw = localStorage.getItem("auth");
    const { accessToken, apiKey } = raw ? JSON.parse(raw) : {};
    if (!accessToken || !apiKey) return extra;

    return {
      Authorization: `Bearer ${accessToken}`,
      "X-Noroff-API-Key": apiKey,
      "Content-Type": "application/json", // 👈 always included
      ...extra,
    };
  } catch {
    return extra;
  }
}
