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

  useEffect(() => {
    if (shouldRedirect) {
      api.clearToken();
      router.replace("/auth/login");
    }
  }, [router, shouldRedirect]);

  if (shouldRedirect || isLoading || !data) {
    return null;
  }

  const currentOrganization =
    data.memberships.find((membership) => membership.organization.id === data.currentOrganizationId)
      ?.organization ?? data.memberships[0]?.organization ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data.user,
      memberships: data.memberships,
      currentOrganization,
    }),
    [data.user, data.memberships, currentOrganization]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
