import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const RETRYABLE_METHODS = new Set(["get", "head", "options"]);

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error.code === "ECONNABORTED") return "The request timed out. Please check the backend and try again.";
  if (!error.response) return "Unable to reach the study engine. Please make sure the backend is running.";

  const data = error.response.data;
  if (typeof data === "string" && /<!doctype html|<html/i.test(data)) {
    return "The study engine returned an unexpected response. Check that the backend route is registered and returning JSON.";
  }
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  if (data && typeof data === "object") {
    const parts = Object.entries(data)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([field, value]) => {
        if (Array.isArray(value)) return `${field}: ${value.join(" ")}`;
        if (typeof value === "object") return `${field}: ${Object.values(value).flat().join(" ")}`;
        return `${field}: ${String(value)}`;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" ") : fallback;
  }
  return typeof data === "string" ? data : fallback;
}

/**
 * Updates the default Authorization header for the axios instance.
 * This is imported and used in main.jsx to keep the token in sync.
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// ── Request interceptor: always read the latest token on every request ──────
// Fix: original code set the header once at module load time (stale token bug).
// Now we read localStorage fresh on every request so refreshed tokens apply immediately.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      delete config.headers["Authorization"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: silent token refresh on 401 ────────────────────────
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      !originalRequest.url.includes("/auth/token/")
    ) {
      originalRequest._retried = true;

      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        localStorage.removeItem("access");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccess = data.access;
        localStorage.setItem("access", newAccess);
        setAuthToken(newAccess);
        processQueue(null, newAccess);
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setAuthToken(null);
        window.dispatchEvent(new Event("auth-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const method = (originalRequest.method || "get").toLowerCase();
    const shouldRetry =
      RETRYABLE_METHODS.has(method) &&
      !originalRequest._retryAttempted &&
      (!error.response || error.response.status >= 500 || error.code === "ECONNABORTED");

    if (shouldRetry) {
      originalRequest._retryAttempted = true;
      await new Promise((resolve) => setTimeout(resolve, 350));
      return api(originalRequest);
    }

    error.userMessage = getApiErrorMessage(error);

    return Promise.reject(error);
  }
);

export default api;
