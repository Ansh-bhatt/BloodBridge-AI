"use client";

import { useState, useEffect } from "react";
import { api, setToken, removeToken } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bb_token");
    if (!token) {
      setLoading(false);
      return;
    }
    
    api.get<User>("/auth/me")
      .then((data) => setUser(data))
      .catch(() => {
        removeToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const register = async (email: string, password: string, full_name: string) => {
    const res = await api.post<AuthResponse>("/auth/register", { email, password, full_name });
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  };

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}