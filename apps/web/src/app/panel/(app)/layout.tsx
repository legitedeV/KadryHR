"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { KadryButton } from "@kadryhr/ui";
import { api } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/panel/dashboard" },
  { label: "Grafik", href: "/panel/grafik" },
  { label: "RCP", href: "/panel/rcp" },
];

export default function PanelLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!api.getToken()) {
      router.replace("/panel/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-emerald-950">
            KadryHR Panel
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-emerald-900">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href
                    ? "text-emerald-600"
                    : "text-emerald-900 hover:text-emerald-600"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
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
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
