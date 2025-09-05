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
  // Works before interceptors see token
  const { data } = await http.get(`${BASE}/create-api-key`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.apiKey;
}
