"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export type AuthState = {
  email: string;
  orgId: string;
  token: string;
};

type AuthContextValue = {
  auth: AuthState | null;
  isReady: boolean;
  login: (email: string, orgId: string) => void;
  logout: () => void;
  setOrgId: (orgId: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("kadryhr_auth");
    if (stored) {
      setAuth(JSON.parse(stored));
    }
    setIsReady(true);
  }, []);

  const persist = (next: AuthState | null) => {
    if (typeof window === "undefined") return;
    if (next) {
      window.localStorage.setItem("kadryhr_auth", JSON.stringify(next));
    } else {
      window.localStorage.removeItem("kadryhr_auth");
    }
  };

  const login = (email: string, orgId: string) => {
    const nextAuth: AuthState = {
      email,
      orgId,
      token: `token-${Date.now()}`,
    };
    setAuth(nextAuth);
    persist(nextAuth);
  };

  const logout = () => {
    setAuth(null);
    persist(null);
  };

  const setOrgId = (orgId: string) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, orgId };
      persist(updated);
      return updated;
    });
  };

  const value = useMemo(() => ({ auth, isReady, login, logout, setOrgId }), [auth, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

type ToastContextValue = {
  toasts: Toast[];
  pushToast: (message: string, type?: Toast["type"]) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const dismiss = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg px-4 py-3 shadow-md border"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: toast.type === "error" ? "#ef4444" : "var(--border-primary)",
              color: toast.type === "error" ? "#b91c1c" : "var(--text-primary)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="text-sm font-semibold uppercase tracking-wide">
                {toast.type === "success" ? "SUKCES" : toast.type === "error" ? "BŁĄD" : "INFO"}
              </div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {toast.message}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="ml-auto text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
