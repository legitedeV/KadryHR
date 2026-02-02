"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import { apiGetMe, User } from "@/lib/api";
import { OnboardingProvider } from "@/features/onboarding/OnboardingProvider";
import { TopbarActionsProvider, useTopbarActions } from "@/lib/topbar-actions-context";
import { PanelShell } from "@/components/panel/PanelShell";
import { LoadingSkeleton } from "@/components/panel/LoadingSkeleton";

function PanelContent({ children, user, onLogout }: { children: ReactNode; user: User; onLogout: () => void }) {
  const { actionsSlot } = useTopbarActions();

  return (
    <PanelShell user={user} onLogout={onLogout} actionsSlot={actionsSlot}>
      {children}
    </PanelShell>
  );
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSession);

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    apiGetMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthTokens();
        router.replace("/login");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession, router]);

  function handleLogout() {
    clearAuthTokens();
    router.push("/login");
  }

  if (!hasSession) return null;

  if (loading) {
    return (
      <div className="page-shell-bleed">
        <div className="min-h-screen flex items-center justify-center bg-[var(--panel-bg)]">
          <div className="w-full max-w-sm space-y-4">
            <div className="h-10 w-10 rounded-md bg-surface-100" />
            <LoadingSkeleton lines={4} />
            <p className="text-sm text-surface-600">Ładowanie panelu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <OnboardingProvider userId={user.id}>
      <TopbarActionsProvider>
        <div className="page-shell-bleed">
          <PanelContent user={user} onLogout={handleLogout}>
            {children}
          </PanelContent>
        </div>
      </TopbarActionsProvider>
    </OnboardingProvider>
  );
}
