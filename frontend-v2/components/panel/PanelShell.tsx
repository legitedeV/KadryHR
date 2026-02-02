"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { titleByPath } from "@/lib/panel-navigation";
import type { User } from "@/lib/api";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type PanelShellProps = {
  user: User;
  onLogout: () => void;
  actionsSlot?: ReactNode;
  children: ReactNode;
};

export function PanelShell({ user, onLogout, actionsSlot, children }: PanelShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = titleByPath[pathname] ?? "Dashboard";

  return (
    <div className="panel-theme min-h-screen bg-[var(--panel-bg)] text-[var(--body-text)]">
      <div className="flex min-h-screen">
        <Sidebar
          user={user}
          activePath={pathname}
          onLogout={onLogout}
          className="hidden lg:flex lg:w-64 border-r border-[var(--border-soft)]"
        />
        <Sidebar
          user={user}
          activePath={pathname}
          onLogout={onLogout}
          collapsed
          className="hidden md:flex lg:hidden md:w-20 border-r border-[var(--border-soft)]"
        />

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <Sidebar
          user={user}
          activePath={pathname}
          onLogout={onLogout}
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } border-r border-[var(--border-soft)]`}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            title={title}
            onMenuOpen={() => setMobileMenuOpen(true)}
            actionsSlot={actionsSlot}
          />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-content w-full mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
