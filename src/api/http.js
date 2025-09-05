// Path: src/api/http.js
import axios from "axios";

/** Single axios instance for the whole app */
export const http = axios.create({
  baseURL: "https://v2.api.noroff.dev",
});

/** Install interceptors that read the latest auth state; returns ejector */
export function installInterceptors({ getToken, getApiKey, onUnauthorized }) {
  const reqId = http.interceptors.request.use((config) => {
    const token = getToken?.();
    const apiKey = getApiKey?.();
    config.headers = config.headers || {};
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (apiKey && !config.headers["X-Noroff-API-Key"]) {
      config.headers["X-Noroff-API-Key"] = apiKey;
    }
    if (config.method && config.method.toLowerCase() !== "get") {
      config.headers["Content-Type"] ??= "application/json";
    }
    return config;
  });

  const resId = http.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) onUnauthorized?.();
      return Promise.reject(err);
    },
  );

  return () => {
    http.interceptors.request.eject(reqId);
    http.interceptors.response.eject(resId);
  };
}
