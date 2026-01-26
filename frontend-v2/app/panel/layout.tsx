"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import { apiGetMe, User } from "@/lib/api";
import { BrandLogoMotion } from "@/components/brand/BrandLogoMotion";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/panel/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/panel/grafik", label: "Grafik", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/panel/grafik-v2", label: "Grafik v2", icon: "M4 6h16M4 12h16M4 18h16" },
  { href: "/panel/dyspozycje", label: "Dyspozycje", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/panel/profil", label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

// Height for mobile menu content area (viewport height minus header and footer)
const MOBILE_MENU_CONTENT_HEIGHT = 'calc(100vh - 180px)';

const titleByPath: Record<string, string> = {
  "/panel/grafik": "Grafik zmian",
  "/panel/grafik-v2": "Grafik zmian v2",
  "/panel/dyspozycje": "Dyspozycje",
  "/panel/profil": "Profil użytkownika",
  "/panel/dashboard": "Dashboard",
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSession);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 animate-pulse" />
          <p className="text-sm text-surface-400">Ładowanie panelu...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex panel-shell relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,155,100,0.12),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(79,159,158,0.12),transparent_60%)]" />
      </div>
        {/* sidebar */}
        <aside className="hidden md:flex md:flex-col w-64 rounded-r-[28px] sidebar-glass shadow-[12px_0_40px_color-mix(in_srgb,var(--color-surface-900)_35%,transparent)]">
          <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-800/60 backdrop-blur">
            <Link href="/panel/dashboard" className="shrink-0">
              <BrandLogoStatic size={36} variant="icon" ariaLabel="KadryHR" />
            </Link>
          </div>
          <nav className="flex-1 py-6 px-4 space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.3em] text-surface-500 mb-3">
              Nawigacja
            </p>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-500 ${
                    active
                      ? "bg-brand-900/35 text-brand-100 shadow-[0_14px_34px_rgba(0,0,0,0.35)] ring-1 ring-brand-700/50"
                      : "text-surface-400 hover:bg-surface-900/50 hover:text-surface-100"
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
          </nav>
          <div className="border-t border-surface-800/60 px-5 py-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-900/60 via-brand-800/40 to-accent-900/50 flex items-center justify-center text-brand-100 font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-100">
                    {user.name}
                  </div>
                  <div className="text-xs text-surface-400">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs rounded-full border border-surface-700/70 px-3 py-1 font-medium text-surface-300 transition-colors duration-500 hover:bg-surface-800/60 hover:text-surface-100"
              >
                Wyloguj
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Żabka · demo</span>
            </div>
          </div>
        </aside>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile menu sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } sidebar-glass border-r border-surface-800/70`}>
          <div className="h-16 flex items-center justify-between gap-3 px-4 border-b border-surface-800/60">
            <Link href="/panel/dashboard" className="shrink-0">
              <BrandLogoStatic size={34} variant="icon" ariaLabel="KadryHR" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-surface-300 transition-colors duration-500 hover:text-surface-50"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" style={{ maxHeight: MOBILE_MENU_CONTENT_HEIGHT }}>
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.3em] text-surface-500 mb-3">
              Nawigacja
            </p>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-500 ${
                    active
                      ? "bg-brand-900/35 text-brand-100 shadow-[0_14px_34px_rgba(0,0,0,0.35)] ring-1 ring-brand-700/50"
                      : "text-surface-400 hover:bg-surface-900/50 hover:text-surface-100"
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
          </nav>
          <div className="border-t border-surface-800 px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-900/60 via-brand-800/40 to-accent-900/50 flex items-center justify-center text-brand-100 font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-100">
                    {user.name}
                  </div>
                  <div className="text-xs text-surface-400">
                    {user.role}
                  </div>
                </div>
              </div>
                <button
                  onClick={handleLogout}
                  className="text-xs rounded-lg border border-surface-700/70 px-2 py-1 font-medium text-surface-300 transition-colors duration-500 hover:bg-surface-800/60 hover:text-surface-100"
                >
                  Wyloguj
                </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Żabka · demo</span>
            </div>
          </div>
        </aside>

        {/* main area */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-surface-800/70 bg-[var(--panel-header-bg)] px-4 lg:px-6 flex items-center justify-between gap-4 backdrop-blur">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-surface-300 transition-colors duration-500 hover:text-surface-50"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/panel/dashboard" className="hidden sm:block shrink-0">
                <BrandLogoMotion size={32} variant="full" withPL={false} ariaLabel="KadryHR" enableHover={false} />
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-medium text-surface-400">
                  KadryHR · panel
                </p>
                <p className="text-sm font-semibold text-surface-50 truncate">
                  {titleByPath[pathname] ?? "Dashboard"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 rounded-full border border-surface-800/70 bg-surface-950/70 px-3 py-1.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-900/50 to-brand-800/50 flex items-center justify-center text-brand-200 font-semibold text-xs">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-surface-200">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-surface-400">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 sm:px-5 lg:px-8 py-6 lg:py-8 bg-[var(--panel-bg)]">
            <div className="max-w-[1600px] w-full mx-auto panel-page">{children}</div>
          </main>
        </div>
      </div>
  );
}
