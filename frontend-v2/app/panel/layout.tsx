"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";
import { apiGetMe, User } from "@/lib/api";

const navItems = [
  { href: "/panel/grafik", label: "Grafik" },
  // w przyszłości dodasz /panel/dashboard, /panel/pracownicy itd.
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
      <div className="min-h-screen flex items-center justify-center text-slate-300 text-sm">
        Ładowanie...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 border-r border-slate-800 bg-slate-950">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-slate-800">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold">
            K
          </div>
          <div>
            <div className="text-sm font-semibold">KadryHR</div>
            <div className="text-[11px] text-slate-500">Panel</div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-2 text-sm space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 ${
                  active
                    ? "bg-slate-900 text-emerald-200"
                    : "text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <div>{user.name}</div>
          <div className="flex justify-between items-center mt-1">
            <span>{user.role}</span>
            <button
              className="text-emerald-300 hover:text-emerald-200"
              onClick={handleLogout}
            >
              Wyloguj
            </button>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/90">
          <div>
            <p className="text-[11px] text-slate-500">Lokalizacja</p>
            <p className="text-sm text-slate-100">Żabka · demo</p>
          </div>
          <div className="text-xs text-slate-400">
            Zalogowany jako{" "}
            <span className="text-slate-100">{user.email}</span>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-4 md:py-6">{children}</main>
      </div>
    </div>
  );
}
