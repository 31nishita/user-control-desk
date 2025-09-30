import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type ApiUser = { id: string | number; email: string; name: string };
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:3001";

export const useAuth = () => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${API_BASE}/api/auth/me`, { signal: controller.signal, headers })
      .then(async (res) => {
        if (!res.ok) throw new Error("not authenticated");
        const data = await res.json();
        setUser(data.user as ApiUser);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: new Error(err.error || "Login failed") } as const;
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    setUser(data.user as ApiUser);
    return { data, error: null } as const;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: new Error(err.error || "Signup failed") } as const;
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    setUser(data.user as ApiUser);
    return { data, error: null } as const;
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
