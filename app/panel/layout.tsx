"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";
import { apiGetMe, User } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/panel/dashboard", label: "Dashboard" },
  { href: "/panel/grafik", label: "Grafik" },
  { href: "/panel/pracownicy", label: "Pracownicy" },
  { href: "/panel/wnioski", label: "Wnioski" }
];

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    apiGetMe(token)
      .then(setUser)
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Ładowanie panelu...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 border-r border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-soft">
            K
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              KadryHR
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Panel zarządzania
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 text-sm space-y-1">
          <p className="px-2 text-[11px] font-medium uppercase text-slate-400 dark:text-slate-500">
            Nawigacja
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100 dark:bg-slate-900 dark:text-brand-200 dark:border-slate-700"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/60"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <div className="text-slate-800 dark:text-slate-100">
                {user.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[11px] rounded-full border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              Wyloguj
            </button>
          </div>
          <p className="text-[11px]">
            Lokalizacja: <span className="font-medium">Żabka · demo</span>
          </p>
        </div>
      </aside>

      {/* main area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-200/70 bg-white/80 backdrop-blur px-4 flex items-center justify-between dark:border-slate-800 dark:bg-slate-950/90">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              KadryHR · panel
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {pathname === "/panel/grafik"
                ? "Grafik zmian"
                : pathname === "/panel/pracownicy"
                ? "Pracownicy"
                : pathname === "/panel/wnioski"
                ? "Wnioski"
                : "Dashboard"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <ThemeToggle />
            <span className="hidden sm:inline">
              Zalogowany jako{" "}
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {user.email}
              </span>
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-4 md:py-6 bg-gradient-to-b from-slate-50/80 to-slate-100/60 dark:from-slate-950 dark:to-slate-950">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
