"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { KadryButton } from "@kadryhr/ui";
import { api, ApiOrganization, ApiUser } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/panel/dashboard" },
  { label: "Pracownicy", href: "/panel/pracownicy" },
  { label: "Lokalizacje", href: "/panel/lokalizacje" },
  { label: "Grafik", href: "/panel/grafik" },
  { label: "RCP", href: "/panel/rcp" },
];

export default function PanelLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [organization, setOrganization] = useState<ApiOrganization | null>(null);

  useEffect(() => {
    if (!api.getToken()) {
      router.replace("/panel/login");
      return;
    }

    const load = async () => {
      try {
        const me = await api.getMe();
        setUser(me.user);
        setOrganization(me.organization);
        setReady(true);
      } catch {
        api.clearToken();
        router.replace("/panel/login");
      }
    };

    void load();
  }, [router]);

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold text-emerald-950">
              KadryHR Panel
            </Link>
            {organization ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                {organization.name}
              </span>
            ) : null}
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium text-emerald-900">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? "text-emerald-600" : "text-emerald-900 hover:text-emerald-600"}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="text-sm text-emerald-700">
                {user.firstName} {user.lastName}
              </span>
            ) : null}
            <KadryButton
              variant="ghost"
              size="sm"
              onClick={() => {
                api.clearToken();
                router.replace("/panel/login");
              }}
            >
              Wyloguj
            </KadryButton>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
