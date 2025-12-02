// utils/axiosInstance.js
import axios from "axios";

// URL base de tu backend (centralizada)
export const API_BASE_URL = "http://localhost:3000";

// Instancia de Axios con baseURL común
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    // 👇 Dejamos SOLO estos, sin Content-Type global
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
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

// --- Interceptor de REQUEST: agrega Bearer token si existe ---
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      if (!config.headers) config.headers = {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // 👀 IMPORTANTE: NO tocar Content-Type aquí.
    // Axios decide: JSON para objetos, multipart/form-data para FormData.
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Interceptor de RESPONSE: maneja 401 (sesión expirada/no válida) ---
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
