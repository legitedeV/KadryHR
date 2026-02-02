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
    <div className="panel-theme bg-[var(--panel-bg)] text-[var(--body-text)]">
      <div className="relative h-screen overflow-hidden">
        <Sidebar
          user={user}
          activePath={pathname}
          onLogout={onLogout}
          className="hidden lg:flex fixed inset-y-0 left-0 w-64 border-r border-[var(--border-soft)]"
        />
        <Sidebar
          user={user}
          activePath={pathname}
          onLogout={onLogout}
          collapsed
          className="hidden md:flex lg:hidden fixed inset-y-0 left-0 w-20 border-r border-[var(--border-soft)]"
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

        <div className="flex h-full flex-col min-w-0 md:ml-20 lg:ml-64">
          <Topbar
            title={title}
            onMenuOpen={() => setMobileMenuOpen(true)}
            actionsSlot={actionsSlot}
          />
          <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
