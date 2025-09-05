// src/api/http.js
import axios from "axios";

/** Single axios instance for the whole app */
export const http = axios.create({
  baseURL: "https://v2.api.noroff.dev",
});

// one active pair at a time
let installed = false;
let ejector = null;

/**
 * Install interceptors that read the latest auth state; returns an eject function.
 * Safe to call multiple times – will re-install with fresh closures on each call.
 */
export function installInterceptors({ getToken, getApiKey, onUnauthorized } = {}) {
  // 🔧 CHANGE: if already installed, eject the old pair so we can re-install
  if (installed && ejector) {
    ejector();
  }

  const reqId = http.interceptors.request.use((config) => {
    const token = getToken?.();
    const apiKey = getApiKey?.();

    config.headers ||= {};
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (apiKey && !config.headers["X-Noroff-API-Key"]) {
      config.headers["X-Noroff-API-Key"] = apiKey;
    }

    // Only force JSON when not uploading FormData
    const method = config.method?.toLowerCase();
    const isWrite = method && !["get", "delete"].includes(method);
    const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isWrite && !isFormData) {
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

  installed = true;
  ejector = () => {
    http.interceptors.request.eject(reqId);
    http.interceptors.response.eject(resId);
    installed = false;
    ejector = null;
  };
  return ejector;
}
