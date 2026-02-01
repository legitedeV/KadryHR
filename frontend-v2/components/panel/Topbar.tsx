"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = {
  label: string;
  href?: string;
};

type TopbarProps = {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actionsSlot?: ReactNode;
  onMenuOpen?: () => void;
};

export function Topbar({ title, breadcrumbs, actionsSlot, onMenuOpen }: TopbarProps) {
  const items = breadcrumbs ?? [
    { label: "Panel", href: "/panel/dashboard" },
    { label: title },
  ];

  return (
    <header className="h-16 border-b border-[var(--border-soft)] bg-[var(--panel-header-bg)] px-4 lg:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden p-2 -ml-2 text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--accent)]"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            {items.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex items-center gap-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-[var(--text-main)] underline decoration-transparent underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent-border)]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[var(--text-main)]">{item.label}</span>
                )}
                {index < items.length - 1 && <span className="text-surface-400">/</span>}
              </span>
            ))}
          </nav>
          <p className="text-sm font-semibold text-[var(--text-main)] truncate">{title}</p>
        </div>
      </div>
      {actionsSlot && <div className="flex items-center gap-2">{actionsSlot}</div>}
    </header>
  );
}
