"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "../lib/api-client";
import { AuthenticatedUser, MembershipRole, OrganizationSummary, ProfileResponse } from "../lib/auth-types";
import { setupBrowserSentry } from "../lib/observability/sentry-lite";

export type SessionState = {
  token: string;
  user: AuthenticatedUser;
  organizations: OrganizationSummary[];
  currentOrganization: OrganizationSummary | null;
};

type AuthContextValue = {
  session: SessionState | null;
  isReady: boolean;
  isLoading: boolean;
  api: ReturnType<typeof createApiClient>;
  login: (input: { email: string; password: string; orgId?: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: (orgId?: string) => Promise<void>;
  selectOrganization: (orgId: string) => Promise<void>;
  hasRole: (roles?: MembershipRole | MembershipRole[]) => boolean;
};

const STORAGE_KEY = "kadryhr.auth.v2";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const api = useMemo(
    () => createApiClient(() => ({ token: session?.token, orgId: session?.currentOrganization?.id })),
    [session],
  );

  const persistSession = (value: SessionState | null) => {
    if (typeof window === "undefined") return;
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  };

  const hydrateFromStorage = useCallback(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionState;
    } catch (err) {
      console.error("Failed to parse stored session", err);
      return null;
    }
  }, []);

  const fetchProfile = useCallback(
    async (token: string, orgId?: string) => {
      const profileClient = createApiClient(() => ({ token, orgId }));
      return profileClient.get<ProfileResponse>("/auth/me");
    },
    [],
  );

  const login = useCallback(
    async ({ email, password, orgId }: { email: string; password: string; orgId?: string }) => {
      setIsLoading(true);
      try {
        const unauthenticatedClient = createApiClient(() => ({}));
        const authResponse = await unauthenticatedClient.post<{
          accessToken: string;
          user: AuthenticatedUser;
          organizations: OrganizationSummary[];
          currentOrganization: OrganizationSummary | null;
        }>("/auth/login", { email, password }, { skipAuth: true });

        const preferredOrgId =
          orgId || authResponse.currentOrganization?.id || authResponse.organizations[0]?.id;

        const profile = await fetchProfile(authResponse.accessToken, preferredOrgId);

        const resolvedOrg =
          profile.currentOrganization ||
          authResponse.organizations.find((org) => org.id === preferredOrgId) ||
          profile.organizations[0] ||
          null;

        const nextSession: SessionState = {
          token: authResponse.accessToken,
          user: profile.user,
          organizations: profile.organizations,
          currentOrganization: resolvedOrg,
        };

        setSession(nextSession);
        persistSession(nextSession);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    },
    [fetchProfile],
  );

  const logout = useCallback(() => {
    setSession(null);
    persistSession(null);
  }, []);

  const refreshProfile = useCallback(
    async (orgId?: string) => {
      if (!session?.token) return;
      setIsLoading(true);
      try {
        const profile = await fetchProfile(session.token, orgId || session.currentOrganization?.id || undefined);
        const resolvedOrg = profile.currentOrganization || session.currentOrganization || profile.organizations[0] || null;
        const nextSession: SessionState = {
          token: session.token,
          user: profile.user,
          organizations: profile.organizations,
          currentOrganization: resolvedOrg,
        };
        setSession(nextSession);
        persistSession(nextSession);
      } catch (error) {
        console.error("Profile refresh failed", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProfile, logout, session],
  );

  const selectOrganization = useCallback(
    async (orgId: string) => {
      if (!session?.token) return;
      await refreshProfile(orgId);
    },
    [refreshProfile, session?.token],
  );

  const hasRole = useCallback(
    (roles?: MembershipRole | MembershipRole[]) => {
      if (!roles) return true;
      if (!session?.currentOrganization?.role) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(session.currentOrganization.role);
    },
    [session?.currentOrganization?.role],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setupBrowserSentry();
    const stored = hydrateFromStorage();
    if (stored) {
      setSession(stored);
      fetchProfile(stored.token, stored.currentOrganization?.id)
        .then((profile) => {
          const resolvedOrg = profile.currentOrganization || stored.currentOrganization || profile.organizations[0] || null;
          const nextSession: SessionState = {
            token: stored.token,
            user: profile.user,
            organizations: profile.organizations,
            currentOrganization: resolvedOrg,
          };
          setSession(nextSession);
          persistSession(nextSession);
          setIsReady(true);
        })
        .catch((err) => {
          console.error("Failed to bootstrap session", err);
          logout();
          setIsReady(true);
        });
    } else {
      setIsReady(true);
    }
  }, [fetchProfile, hydrateFromStorage, logout]);

  const value = useMemo(
    () => ({ session, isReady, isLoading, api, login, logout, refreshProfile, selectOrganization, hasRole }),
    [api, hasRole, isLoading, isReady, login, logout, refreshProfile, selectOrganization, session],
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
