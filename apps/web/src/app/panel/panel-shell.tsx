"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { KadryButton } from "@kadryhr/ui";
import { api } from "@/lib/api";
import { useAuth } from "./auth-provider";

const navItems = [
  { label: "Dashboard", href: "/panel/dashboard" },
  { label: "Pracownicy", href: "/panel/pracownicy" },
  { label: "Lokalizacje", href: "/panel/lokalizacje" },
  { label: "Grafik", href: "/panel/grafik" },
  { label: "RCP", href: "/panel/rcp" },
  { label: "Urlopy i nieobecności", href: "/panel/urlopy" },
  { label: "Raporty", href: "/panel/raporty" },
  { label: "Ustawienia organizacji", href: "/panel/ustawienia-organizacji" },
];

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, currentOrganization } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    const first = user.firstName?.[0] ?? "";
    const last = user.lastName?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }, [user.firstName, user.lastName]);

  return (
    <div className="flex min-h-screen bg-emerald-50">
      <aside className="hidden w-64 flex-col border-r border-emerald-100 bg-white px-4 py-6 lg:flex">
        <Link href="/panel/dashboard" className="px-2 text-lg font-semibold text-emerald-950">
          KadryHR
        </Link>
        <nav className="mt-6 flex flex-col gap-1 text-sm font-medium text-emerald-900">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-emerald-100 text-emerald-700" : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-emerald-100 bg-white">
          <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">Aktywna organizacja</p>
                <p className="text-lg font-semibold text-emerald-950">
                  {currentOrganization?.name ?? "Brak organizacji"}
                </p>
              </div>
              <Link
                href="/panel/select-organization"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
              >
                Zmień organizację
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-emerald-500">{user.email}</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {initials || "U"}
                </button>
                {menuOpen ? (
                  <div
                    className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-emerald-100 bg-white p-2 shadow-lg"
                    role="menu"
                  >
                    <Link
                      href="/panel/profil"
                      className="block rounded px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-50"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profil
                    </Link>
                    <Link
                      href="/panel/ustawienia-konta"
                      className="block rounded px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-50"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Ustawienia
                    </Link>
                    <KadryButton
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start text-left"
                      onClick={() => {
                        api.clearToken();
                        router.replace("/auth/login");
                      }}
                    >
                      Wyloguj
                    </KadryButton>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
