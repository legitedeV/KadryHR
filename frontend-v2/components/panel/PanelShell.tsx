"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { titleByPath } from "@/lib/panel-navigation";
import type { OrganisationModuleKey, OrganisationModulesState, User } from "@/lib/api";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MODULE_LABELS, findModuleForPath } from "@/lib/organisation-modules";

type PanelShellProps = {
  user: User;
  onLogout: () => void;
  actionsSlot?: ReactNode;
  children: ReactNode;
  modules?: OrganisationModulesState | null;
};

export function PanelShell({ user, onLogout, actionsSlot, children, modules }: PanelShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = titleByPath[pathname] ?? "Dashboard";
  const blockedModule = findModuleForPath(pathname);
  const isModuleDisabled = blockedModule ? modules?.[blockedModule] === false : false;

  const disabledView = blockedModule ? (
    <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-surface-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-surface-900">Moduł wyłączony przez administratora organizacji</h2>
      <p className="mt-3 text-sm text-surface-600">
        Moduł {MODULE_LABELS[blockedModule as OrganisationModuleKey]} jest aktualnie niedostępny dla Twojej organizacji.
      </p>
    </div>
  ) : null;


  return (
    <div className="panel-theme bg-[var(--panel-bg)] text-[var(--body-text)]">
      <div className="relative h-screen overflow-hidden">
        <Sidebar
          user={user}
          activePath={pathname}
          onLogout={onLogout}
          modules={modules}
          className="hidden lg:flex fixed inset-y-0 left-0 w-64 border-r border-[var(--border-soft)]"
        />
        <Sidebar
          user={user}
          activePath={pathname}
          onLogout={onLogout}
          modules={modules}
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
          modules={modules}
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
            <div className="w-full space-y-6">{isModuleDisabled ? disabledView : children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
