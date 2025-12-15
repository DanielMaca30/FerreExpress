import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/axiosInstance"; // ajusta la ruta real

const LS_KEY = "user";

const AuthContext = createContext();

// --- Utils -------------------------------
function base64UrlDecode(input) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  try {
    // Navegadores modernos
    return new TextDecoder().decode(
      Uint8Array.from(binary, (c) => c.charCodeAt(0))
    );
  } catch {
    // Fallback (manejo de UTF-8 en navegadores viejos)
    return decodeURIComponent(escape(binary));
  }
}

function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isExpired(payload) {
  if (!payload?.exp) return false; // si el token no trae exp, asumimos válido (no recomendado, pero tolerante)
  return Date.now() >= payload.exp * 1000;
}

function setAxiosAuthHeader(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
// -----------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hidrata desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const payload = decodeJwt(parsed?.token);
        if (payload && !isExpired(payload)) {
          setUser(parsed);
          setAxiosAuthHeader(parsed.token);
        } else {
          // token inválido/expirado → limpiar
          localStorage.removeItem(LS_KEY);
          setAxiosAuthHeader(null);
        }
      } catch {
        localStorage.removeItem(LS_KEY);
        setAxiosAuthHeader(null);
      }
    }
    setLoading(false);
  }, []);

  // Helpers -------------------------------------------------
  const persist = (u) => {
    setUser(u);
    localStorage.setItem(LS_KEY, JSON.stringify(u));
    setAxiosAuthHeader(u?.token);
  };

  // Si vienes con token (ej. Google callback), arma el user desde el JWT
  const setUserFromToken = (token) => {
    const payload = decodeJwt(token) || {};
    if (isExpired(payload)) {
      // no persistimos tokens vencidos
      return null;
    }
    const role = (payload.role || payload.rol || "").toString().toUpperCase();
    const username =
      payload.username ||
      payload.name ||
      payload.sub ||
      payload.email ||
      "Usuario";
    const email = payload.email || null;

    const hydrated = {
      token,
      role,
      username,
      email,
      id: payload.sub || payload.id || payload.userId || null,
    };
    persist(hydrated);
    return hydrated;
  };

  // API -----------------------------------------------------
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      // Esperamos: { token, role, email, username }
      const token = res.data?.token;
      const payload = decodeJwt(token);
      if (!token || !payload || isExpired(payload)) {
        return { success: false, message: "Token inválido o expirado" };
      }

      const role = (res.data?.role || "").toString().toUpperCase();
      const username = res.data?.username || email;

      const loggedUser = {
        token,
        role,
        email: res.data?.email || email,
        username,
        id: payload.sub || null,
      };
      persist(loggedUser);
      return { success: true, user: loggedUser };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || "Error en login",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_KEY);
    setAxiosAuthHeader(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, setUserFromToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
