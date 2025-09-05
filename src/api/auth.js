// src/api/auth.js
import { http } from "./http";

const BASE = "/auth";

export async function register(email, password, name, venueManager = false) {
  const payload = { email, password, name, ...(venueManager ? { venueManager: true } : {}) };
  const { data } = await http.post(`${BASE}/register`, payload);
  return data;
}

export async function login(email, password) {
  const { data } = await http.post(`${BASE}/login`, { email, password });
  return data; // { accessToken, refreshToken, ...userInfo }
}

export async function fetchApiKey(accessToken) {
  // Noroff expects POST for create key; be tolerant with response shape
  const { data } = await http.post(
    `${BASE}/create-api-key`,
    { name: "Web Key" },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data?.key ?? data?.data?.key ?? data?.apiKey ?? null;
}
