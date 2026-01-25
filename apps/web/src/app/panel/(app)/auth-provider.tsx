"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, ApiMembership, ApiOrganization, ApiUser } from "@/lib/api";

export type AuthContextValue = {
  user: ApiUser;
  memberships: ApiMembership[];
  currentOrganization: ApiOrganization | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = api.getToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
    enabled: Boolean(token),
    retry: false,
  });

  const shouldRedirect = !token || isError;
  const currentOrganization = useMemo(() => {
    if (!data) {
      return null;
    }

    return (
      data.memberships.find((membership) => membership.organization.id === data.currentOrganizationId)
        ?.organization ?? data.memberships[0]?.organization ?? null
    );
  }, [data]);

  useEffect(() => {
    if (shouldRedirect) {
      api.clearToken();
      router.replace("/auth/login");
    }
  }, [router, shouldRedirect]);

  const value = useMemo<AuthContextValue | null>(() => {
    if (!data) {
      return null;
    }
    return {
      user: data.user,
      memberships: data.memberships,
      currentOrganization,
    };
  }, [data, currentOrganization]);

  if (shouldRedirect || isLoading || !data || !value) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
