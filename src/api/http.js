// src/api/http.js
import axios from "axios";
import { showAlert } from "../helpers/AlarmWarnings.jsx";
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

/** Common response validator */
function validate(res, expect) {
  if (!res || typeof res.data !== "object") {
    showAlert("Unexpected server response. Please try again.", "warning");
    throw new Error("Unexpected response shape");
  }
  if (typeof expect === "function" && !expect(res)) {
    showAlert("Response did not match expected format.", "warning");
    throw new Error("Expectation failed");
  }
  return res;
}

/** Common error handler */
function handleError(err) {
  const status = err?.response?.status;

  if (status === 401) {
    showAlert("Unauthorized – please log in again.");
  } else if (status === 400) {
    showAlert(" – Email already exists.");
  } else if (status >= 500) {
    showAlert("Server error – please try later.", "warning");
  } else {
    const msg =
      err?.response?.data?.errors?.[0]?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Request failed.";
    showAlert(msg);
  }
  throw err;
}

/** Generic request so GET/POST share identical behavior */
async function request(method, path, { body, params, headers, expect } = {}) {
  try {
    const cfg = { params, headers };
    const res =
      method === "get" || method === "delete"
        ? await http[method](path, cfg)
        : await http[method](path, body, cfg);

    return validate(res, expect);
  } catch (err) {
    handleError(err);
  }
}

/** Public helpers */
export function httpGet(path, opts) {
  return request("get", path, opts);
}

export function httpPost(path, body, opts) {
  return request("post", path, { ...opts, body });
}

export function httpPut(path, body, { params, headers } = {}) {
  return http.put(path, body, { params, headers });
}
export function httpDelete(path, { params, headers } = {}) {
  return http.delete(path, { params, headers });
}
