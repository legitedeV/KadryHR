"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { panelNavItems, PanelNavItemId } from "@/lib/panel-navigation";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";
import { Avatar } from "@/components/Avatar";
import type { User } from "@/lib/api";
import type { OnboardingTargetId } from "@/features/onboarding/onboarding.types";
import { buildAvatarSrc } from "@/lib/avatar";

const navItemToOnboardingTarget: Partial<Record<PanelNavItemId, OnboardingTargetId>> = {
  schedule: "nav-schedule",
  availability: "nav-availability",
  employees: "nav-employees",
};

type SidebarProps = {
  user?: User | null;
  activePath: string;
  onLogout: () => void;
  footerSlot?: ReactNode;
  className?: string;
  collapsed?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
};

const roleLabels: Record<User["role"], string> = {
  OWNER: "Właściciel",
  MANAGER: "Manager",
  ADMIN: "Administrator",
  EMPLOYEE: "Pracownik",
};

export function Sidebar({
  user,
  activePath,
  onLogout,
  footerSlot,
  className,
  collapsed = false,
  isLoading = false,
  errorMessage,
}: SidebarProps) {
  const userPermissions = user?.permissions ?? [];
  const userName = user?.name?.trim() ?? "";
  const roleLabel = user?.role ? roleLabels[user.role] : "";
  const organisationName = user?.organisation?.name?.trim() ?? "";
  const showError = Boolean(errorMessage);
  const showLoading = isLoading && !user;

  return (
    <aside className={`flex flex-col bg-[var(--panel-sidebar-bg)] ${className ?? ""}`}>
      <div className={`h-16 flex items-center gap-3 border-b border-[var(--border-soft)] ${collapsed ? "px-3 justify-center" : "px-5"}`}>
        <Link href="/panel/dashboard" className="shrink-0">
          <BrandLogoStatic size={48} variant="icon" ariaLabel="KadryHR" />
        </Link>
      </div>
      <nav className={`flex-1 py-6 ${collapsed ? "px-2" : "px-4"} space-y-2`}>
        <p className={`${collapsed ? "sr-only" : "px-2"} text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]`}>
          Nawigacja
        </p>
        {panelNavItems
          .filter((item) => {
            if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
              return true;
            }
            return item.requiredPermissions.some((permission) => userPermissions.includes(permission));
          })
          .map((item) => {
          const active = activePath === item.href;
          const onboardingTarget = navItemToOnboardingTarget[item.id];
          return (
            <Link
              key={item.href}
              href={item.href}
              data-onboarding-target={onboardingTarget}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--text-main)] border-[var(--accent-border)]"
                  : "text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-page)] hover:text-[var(--accent)]"
              } ${collapsed ? "justify-center px-2 py-2" : "px-3 py-2"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={`border-t border-[var(--border-soft)] ${collapsed ? "px-3 py-4" : "px-5 py-4"}`}>
        <div className={`flex ${collapsed ? "flex-col items-center gap-3" : "items-center justify-between gap-3"} mb-3`}>
          <div className="flex items-center gap-3">
            <Avatar
              name={userName}
              src={buildAvatarSrc(user?.avatarUrl ?? null, user?.avatarUpdatedAt ?? null)}
            />
            {!collapsed && (
              <div>
                {showLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-surface-100 animate-pulse" />
                    <div className="h-3 w-24 rounded bg-surface-100 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-[var(--text-main)]">
                      {showError ? "Problem z profilem" : userName}
                    </div>
                    {roleLabel && !showError && (
                      <div className="text-xs text-[var(--text-muted)]">{roleLabel}</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className={`rounded-md border border-[var(--border-soft)] font-medium text-[var(--text-main)] transition-colors duration-200 hover:bg-[var(--bg-page)] hover:text-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              collapsed ? "p-2" : "px-3 py-1 text-xs"
            }`}
            aria-label="Wyloguj"
            title="Wyloguj"
          >
            {collapsed ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m0 0 3-3m-3 3 3 3" />
              </svg>
            ) : (
              "Wyloguj"
            )}
          </button>
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {showLoading ? (
              <span className="h-3 w-28 rounded bg-surface-100 animate-pulse" />
            ) : (
              <span>{showError ? "Problem z organizacją" : organisationName}</span>
            )}
          </div>
        )}
        {footerSlot && <div className="mt-3">{footerSlot}</div>}
      </div>
    </aside>
  );
}
