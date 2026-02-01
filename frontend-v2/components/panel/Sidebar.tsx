"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { panelNavItems, PanelNavItemId } from "@/lib/panel-navigation";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";
import type { User } from "@/lib/api";
import type { OnboardingTargetId } from "@/features/onboarding/onboarding.types";

const navItemToOnboardingTarget: Partial<Record<PanelNavItemId, OnboardingTargetId>> = {
  schedule: "nav-schedule",
  availability: "nav-availability",
  employees: "nav-employees",
};

type SidebarProps = {
  user: User;
  activePath: string;
  onLogout: () => void;
  footerSlot?: ReactNode;
  className?: string;
};

export function Sidebar({ user, activePath, onLogout, footerSlot, className }: SidebarProps) {
  return (
    <aside className={`flex flex-col bg-[var(--panel-sidebar-bg)] ${className ?? ""}`}>
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--border-soft)]">
        <Link href="/panel/dashboard" className="shrink-0">
          <BrandLogoStatic size={36} variant="icon" ariaLabel="KadryHR" />
        </Link>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
          Nawigacja
        </p>
        {panelNavItems
          .filter((item) => {
            if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
              return true;
            }
            return item.requiredPermissions.some((permission) => user.permissions.includes(permission));
          })
          .map((item) => {
          const active = activePath === item.href;
          const onboardingTarget = navItemToOnboardingTarget[item.id];
          return (
            <Link
              key={item.href}
              href={item.href}
              data-onboarding-target={onboardingTarget}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium border transition-colors ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--text-main)] border-[var(--accent-border)]"
                  : "text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-page)] hover:text-[var(--accent)]"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--border-soft)] px-5 py-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-[var(--accent-soft)] flex items-center justify-center text-[var(--text-main)] font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-main)]">
                {user.name}
              </div>
              <div className="text-xs text-[var(--text-muted)]">{user.role}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-xs rounded-md border border-[var(--border-soft)] px-3 py-1 font-medium text-[var(--text-main)] transition-colors duration-200 hover:bg-[var(--bg-page)] hover:text-[var(--accent-hover)]"
          >
            Wyloguj
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Żabka · demo</span>
        </div>
        {footerSlot && <div className="mt-3">{footerSlot}</div>}
      </div>
    </aside>
  );
}
