"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "../components/layout/app-shell";
import { useAuth } from "../providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    if (!session) {
      const nextReturnUrl = encodeURIComponent(pathname || "/");
      router.replace(`/login?returnUrl=${nextReturnUrl}`);
    }
  }, [isReady, pathname, router, session]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
        Ładowanie kontekstu...
      </div>
    );
  }

  if (!session) return null;

  return <AppShell>{children}</AppShell>;
}
