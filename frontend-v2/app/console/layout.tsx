"use client";

import Link from "next/link";
import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";
import { EmptyState } from "@/components/EmptyState";
import { PANEL_APP_URL } from "@/lib/site-config";

type ConsoleNavItem = {
  href: string;
  label: string;
  icon: string;
};

type ConsoleNavGroup = {
  title: string;
  items: ConsoleNavItem[];
};

const consoleNavGroups: ConsoleNavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/console", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    ],
  },
  {
    title: "Website & Content",
    items: [
      { href: "/console/website", label: "Website CMS", icon: "M4 6h16M4 10h16M4 14h10M4 18h8" },
      { href: "/console/content", label: "Content & i18n", icon: "M12 6v12m6-6H6" },
    ],
  },
  {
    title: "Product Configuration",
    items: [
      { href: "/console/frontend", label: "Frontend", icon: "M10 3H5a2 2 0 00-2 2v5m7-7h9a2 2 0 012 2v5m-11 8v3a2 2 0 002 2h5m-7-7H5a2 2 0 01-2-2v-5m7 7h9a2 2 0 002-2v-5" },
      { href: "/console/backend", label: "Backend", icon: "M5.25 8.25h13.5m-13.5 7.5h13.5M3.75 5.25h16.5a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 16.5v-9a2.25 2.25 0 012.25-2.25z" },
    ],
  },
  {
    title: "Messages",
    items: [
      { href: "/console/messages", label: "Emails & SMS", icon: "M2.25 6.75l9.75 6 9.75-6M3 7.5v9.75A2.25 2.25 0 005.25 19.5h13.5A2.25 2.25 0 0021 17.25V7.5" },
    ],
  },
  {
    title: "Status & Logs",
    items: [
      { href: "/console/status", label: "Status", icon: "M3 13.5h6m6 0h6M9 6.75h6M5.25 6.75h.008v.008H5.25V6.75zm13.5 0h.008v.008h-.008V6.75zm-13.5 13.5h.008v.008H5.25v-.008zm13.5 0h.008v.008h-.008v-.008z" },
      { href: "/console/logs", label: "Logs", icon: "M4.5 6.75h15m-15 5.25h15m-15 5.25h15" },
    ],
  },
  {
    title: "Tools & Deploy",
    items: [
      { href: "/console/tools", label: "Tools", icon: "M11.25 2.25c.414 0 .75.336.75.75v1.5h1.5a.75.75 0 010 1.5H12v1.5a.75.75 0 01-1.5 0V6h-1.5a.75.75 0 010-1.5H10.5v-1.5c0-.414.336-.75.75-.75zM4.5 9h3.75m7.5 0H19.5M3 13.5h7.5m3 0H21" },
      { href: "/console/github", label: "GitHub & Deploy", icon: "M12 8.25v-1.5m0 10.5v-1.5m4.5-4.5h-1.5m-6 0H7.5m7.06-3.06l-1.06 1.06m-4.5 4.5l-1.06 1.06m0-6.12l1.06 1.06m4.5 4.5l1.06 1.06M12 6.75a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" },
    ],
  },
];

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isAuthorized = useMemo(
    () => !!user && ["ADMIN", "OWNER"].includes(user.role),
    [user],
  );

  const environmentLabel = useMemo(() => {
    if (typeof window === "undefined") return "PROD";
    const host = window.location.hostname.toLowerCase();
    if (host.includes("localhost") || host.includes("127.0.0.1")) return "LOCAL";
    if (host.includes("staging") || host.includes("stage")) return "STAGE";
    if (host.includes("dev")) return "DEV";
    return "PROD";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-surface-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 animate-pulse" />
          <p className="text-sm">Weryfikacja dostępu do konsoli...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <EmptyState
            title="Brak dostępu do konsoli"
            description="Konsola administratora jest dostępna wyłącznie dla użytkowników z rolą ADMIN lub OWNER."
            action={
              <Link href={`${PANEL_APP_URL}/panel/dashboard`} className="btn-primary px-4 py-2">
                Wróć do panelu
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface-950 text-surface-50">
      <aside className="hidden lg:flex lg:flex-col w-72 border-r border-surface-800/60 bg-gradient-to-b from-[#0b1411] via-[#0f1a15] to-[#0b1411]">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-800/60">
          <BrandLogoStatic size={32} variant="icon" ariaLabel="KadryHR" />
          <div>
            <p className="text-sm font-semibold text-surface-100">KadryHR</p>
            <p className="text-xs text-surface-400">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-6">
          {consoleNavGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="px-3 text-[11px] uppercase tracking-[0.3em] text-surface-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-brand-900/40 text-brand-100 shadow-[0_8px_24px_rgba(16,185,129,0.18)] ring-1 ring-brand-700/60"
                          : "text-surface-400 hover:bg-surface-900/60 hover:text-surface-100"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-400/80" />
                      )}
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandLogoStatic size={28} variant="icon" ariaLabel="KadryHR" />
            <span className="text-sm font-semibold text-surface-100">Admin Console</span>
          </div>
          <div className="hidden lg:block text-sm text-surface-400">
            Zarządzaj platformą KadryHR
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-surface-800/80 bg-surface-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-200">
              {environmentLabel}
            </span>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-900/60 via-brand-800/40 to-accent-900/60 flex items-center justify-center text-brand-100 font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-surface-100">{user.name}</div>
              <div className="text-xs text-surface-400">{user.role}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 bg-surface-950">
          {children}
        </main>
      </div>
    </div>
  );
}
