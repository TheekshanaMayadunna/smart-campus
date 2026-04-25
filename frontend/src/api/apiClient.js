import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:8085/api";

function resolveApiBaseUrl() {
  const rawValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawValue) return DEFAULT_API_BASE_URL;

  try {
    const parsed = new URL(rawValue);
    // Guard against stale local config pointing to a dead backend.
    if (parsed.hostname === "localhost" && parsed.port === "8181") {
      return DEFAULT_API_BASE_URL;
    }
  } catch {
    return DEFAULT_API_BASE_URL;
  }

  return rawValue;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});