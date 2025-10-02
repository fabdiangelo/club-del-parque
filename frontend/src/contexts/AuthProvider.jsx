import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/club-del-parque-68530/us-central1";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setErrorFromCatch = (err) => {
    console.log(err)
    const msg = err?.message || String(err) || "Error desconocido";
    setError(msg.replace('{"error":"', '').replace('"}', ''));
  };

  // Fetch /me and update state
  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.status === 204 || res.status === 401) {
        setUser(null);
        setLoading(false);
        return null;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Unexpected /me response: ${res.status} ${txt}`);
      }

      const data = await res.json();
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error("fetchMe error:", err);
      // setErrorFromCatch(err);
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const register = useCallback(async (path = "api/auth/register", body = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Register failed: ${res.status}`);
      }

      await fetchMe();
      return true;
    } catch (err) {
      console.error("register error:", err);
      setErrorFromCatch(err);
      setLoading(false);
      return false;
    }
  }, [fetchMe]);

  const login = useCallback(async (path = "api/auth/login", body = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Login failed: ${res.status}`);
      }

      await fetchMe();
      return true;
    } catch (err) {
      console.error("login error:", err);
      setErrorFromCatch(err);
      setLoading(false);
      return false;
    }
  }, [fetchMe]);

  const logout = useCallback(async (path = "api/auth/logout") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Logout failed: ${res.status}`);
      }
      
      setUser(null);
      await fetchMe();
      setLoading(false);
      
      return true;
    } catch (err) {
      console.error("logout error:", err);
      setErrorFromCatch(err);
      setLoading(false);
      return false;
    }
  }, [fetchMe]);

  const value = {
    user,
    loading,
    error,     // string listo para renderizar
    refetchUser: fetchMe,
    register,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children, fallback = null }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return fallback;
  return children;
}
