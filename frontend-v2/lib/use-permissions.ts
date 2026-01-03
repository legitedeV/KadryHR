"use client";

import { useAuth } from "./auth-context";
import type { Permission } from "./api";
import { useCallback, useMemo } from "react";

export function usePermissions() {
  const { user } = useAuth();
  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);

  const hasPermission = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (required: Permission[]) => required.some((permission) => permissions.includes(permission)),
    [permissions],
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
  };
}
