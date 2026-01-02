"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "./api-client";
import { apiGetMe, apiLogin, apiLogout, mapUser, User } from "./api";
import { clearAuthTokens, getAuthTokens } from "./auth";
import { pushToast } from "./toast";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (getAuthTokens()?.accessToken) {
          const profile = await apiGetMe();
          setUser(profile);
          return;
        }
        const refreshed = await apiClient.refreshSession({ suppressToast: true });
        if (refreshed?.user) {
          setUser(mapUser(refreshed.user));
          return;
        }
      } catch {
        clearAuthTokens();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await apiLogin(email, password);
      setUser(result.user);
      return result.user;
    } catch (error) {
      clearAuthTokens();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  };

    const refresh = async () => {
      try {
        const profile = await apiGetMe();
        setUser(profile);
        return profile;
      } catch {
        clearAuthTokens();
        setUser(null);
        pushToast({
        title: "Sesja wygasła",
        description: "Zaloguj się ponownie.",
        variant: "warning",
      });
      return null;
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
