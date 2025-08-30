import axios from "axios";
import { readSession } from "../utils/session.js";

export const http = axios.create({ baseURL: "https://v2.api.noroff.dev" });

// Auto-attach JWT + API key + JSON
http.interceptors.request.use((config) => {
  const { token, apiKey } = readSession();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (apiKey) config.headers["X-Noroff-API-Key"] = apiKey;
  if (!config.headers["Content-Type"]) config.headers["Content-Type"] = "application/json";
  return config;
});
