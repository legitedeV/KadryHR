"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { PanelShell } from "./panel-shell";

const authRoutes = ["/panel/login", "/panel/register", "/panel/forgot-password"];

export default function PanelLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    return <div className="min-h-screen bg-emerald-50">{children}</div>;
  }

  return (
    <AuthProvider>
      <PanelShell>{children}</PanelShell>
    </AuthProvider>
  );
}
