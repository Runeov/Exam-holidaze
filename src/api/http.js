// src/api/http.js
import axios from "axios";
import { readSession } from "../utils/session.js";

// Single axios instance for the app
export const http = axios.create({ baseURL: "https://v2.api.noroff.dev" });

// Attach auth + defaults on every request
http.interceptors.request.use((config) => {
  const { token, apiKey } = readSession() || {};

  // Always have a headers object
  config.headers = config.headers || {};

  // Add Authorization if caller didn't override it
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add API key if caller didn't override it
  if (apiKey && !config.headers["X-Noroff-API-Key"]) {
    config.headers["X-Noroff-API-Key"] = apiKey;
  }

  // JSON by default for non-GET
  if (config.method && config.method.toLowerCase() !== "get") {
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }

  return config;
});

// Thin helpers that USE the interceptor-enabled instance
export function httpGet(path, { params, headers } = {}) {
  return http.get(path, { params, headers });
}
export function httpPost(path, body, { params, headers } = {}) {
  return http.post(path, body, { params, headers });
}
export function httpPut(path, body, { params, headers } = {}) {
  return http.put(path, body, { params, headers });
}
export function httpDelete(path, { params, headers } = {}) {
  return http.delete(path, { params, headers });
}
