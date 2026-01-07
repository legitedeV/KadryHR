"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import { apiGetMe, User } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/brand/Logo";

const navItems = [
  { href: "/panel/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/panel/grafik", label: "Grafik", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/panel/dyspozycje", label: "Dyspozycje", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/panel/pracownicy", label: "Pracownicy", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/panel/wnioski", label: "Wnioski", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { href: "/panel/powiadomienia", label: "Powiadomienia", icon: "M15 17h5l-1.405-1.405M19 10A7 7 0 115 10a7 7 0 0114 0z" },
  { href: "/panel/newsletter-subscribers", label: "Subskrybenci", icon: "M16 12a4 4 0 10-8 0 4 4 0 008 0z M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/panel/audit", label: "Audit", icon: "M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8" },
  { href: "/panel/organizacja", label: "Organizacja", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", roles: ["OWNER", "MANAGER"] },
  { href: "/panel/profil", label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const titleByPath: Record<string, string> = {
  "/panel/grafik": "Grafik zmian",
  "/panel/dyspozycje": "Dyspozycje",
  "/panel/pracownicy": "Pracownicy",
  "/panel/wnioski": "Wnioski",
  "/panel/profil": "Profil użytkownika",
  "/panel/dashboard": "Dashboard",
  "/panel/powiadomienia": "Powiadomienia",
  "/panel/powiadomienia/wyslij": "Nowa kampania",
  "/panel/powiadomienia/historia": "Historia kampanii",
  "/panel/newsletter-subscribers": "Subskrybenci newslettera",
  "/panel/audit": "Audit log",
  "/panel/organizacja": "Ustawienia organizacji",
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 animate-pulse" />
          <p className="text-sm text-surface-500 dark:text-surface-400">Ładowanie panelu...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-surface-200/80 glass dark:border-surface-800/80">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-100 dark:border-surface-800">
          <Logo
            variant="compact"
            size="sm"
            alt="KadryHR"
            className="max-w-[190px]"
            asLink="/panel/dashboard"
            label="KadryHR"
          />
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
            Nawigacja
          </p>
          {navItems
            .filter((item) => {
              // Filter by roles if specified
              const roles = (item as { roles?: string[] }).roles;
              if (!roles) return true;
              return roles.includes(user.role);
            })
            .map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-brand-50 to-brand-100/50 text-brand-700 shadow-sm ring-1 ring-brand-200/50 dark:from-brand-950/50 dark:to-brand-900/30 dark:text-brand-300 dark:ring-brand-800/50"
                    : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/50 dark:hover:text-surface-200"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-surface-100 px-5 py-4 dark:border-surface-800">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-surface-200 to-surface-300 flex items-center justify-center text-surface-600 font-semibold dark:from-surface-700 dark:to-surface-600 dark:text-surface-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  {user.name}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {user.role}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs rounded-lg border border-surface-200 px-2.5 py-1.5 font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200 transition-colors"
            >
              Wyloguj
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
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
        <header className="h-16 border-b border-surface-200/80 glass px-6 flex items-center justify-between gap-4 dark:border-surface-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
                KadryHR · panel
              </p>
              <p className="text-base font-bold text-surface-900 dark:text-surface-50 truncate">
                {titleByPath[pathname] ?? "Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-semibold dark:from-brand-900/50 dark:to-brand-800/50 dark:text-brand-300">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-surface-600 dark:text-surface-300">
                {user.email}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-4 lg:px-6 py-6 bg-gradient-to-b from-surface-50/80 to-surface-100/60 dark:from-surface-950 dark:to-surface-950">
          <div className="max-w-[1600px] w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
