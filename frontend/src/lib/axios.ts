import axios from "axios";

declare const process:
  | { env?: Record<string, string | undefined> }
  | undefined;

function normalizeApiBaseUrl(value?: string) {
  const trimmed = (value || "http://localhost:8000").trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const api = axios.create({
  baseURL: normalizeApiBaseUrl(process?.env?.NEXT_PUBLIC_API_URL),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = window.localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.userMessage = "Server unavailable. Start Django on http://localhost:8000 and use HTTP for local development.";
    } else if (error.response.status === 401) {
      error.userMessage = "Invalid username or password.";
    } else {
      error.userMessage = error.response.data?.detail || "Request failed. Please try again.";
    }
    return Promise.reject(error);
  }
);

export default api;
