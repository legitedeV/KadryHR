"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/EmptyState";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-surface-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-sm">Weryfikacja uprawnień...</p>
      </div>
    );
  }

  if (!user || !["ADMIN", "OWNER"].includes(user.role)) {
    return (
      <div className="panel-card p-8">
        <EmptyState
          title="Brak dostępu"
          description="Panel administratora jest dostępny tylko dla użytkowników z rolą ADMIN lub OWNER. Jeśli uważasz, że powinieneś mieć dostęp, skontaktuj się z administratorem systemu."
          action={
            <Link href="/panel/dashboard" className="btn-primary px-4 py-2">
              Wróć do dashboardu
            </Link>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
