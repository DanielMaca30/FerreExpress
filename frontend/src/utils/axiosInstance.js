// utils/axiosInstance.js
import axios from "axios";

// URL base del backend (prod via Vercel env, local fallback)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    // ❌ NO poner Content-Type global
  },
});

// --- Helpers internos ---
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getToken() {
  const u = getStoredUser();
  return u?.token || null;
}

function logoutAndRedirect(err) {
  const path =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  const isOnLogin = path.toLowerCase().startsWith("/login");

  try {
    localStorage.removeItem("user");
  } catch {}

  if (!isOnLogin && typeof window !== "undefined") {
    const from = encodeURIComponent(path);
    window.location.assign(`/login?reason=expired&from=${from}`);
  }

  return Promise.reject(err);
}

// --- Interceptor REQUEST: agrega Bearer token ---
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      if (!config.headers) config.headers = {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Interceptor RESPONSE: maneja 401 ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      const url = (error?.config?.url || "").toLowerCase();
      const isAuthRoute =
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/google") ||
        url.includes("/auth/refresh");

      if (!isAuthRoute) {
        return logoutAndRedirect(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
