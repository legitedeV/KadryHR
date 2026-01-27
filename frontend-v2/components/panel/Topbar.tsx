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
    <header className="h-16 border-b border-surface-300 bg-[var(--panel-header-bg)] px-4 lg:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden p-2 -ml-2 text-surface-600 transition-colors duration-200 hover:text-surface-900"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <nav className="flex items-center gap-2 text-xs text-surface-600">
            {items.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex items-center gap-2">
                {item.href ? (
                  <Link href={item.href} className="hover:text-surface-900 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
                {index < items.length - 1 && <span className="text-surface-400">/</span>}
              </span>
            ))}
          </nav>
          <p className="text-sm font-semibold text-surface-900 truncate">{title}</p>
        </div>
      </div>
      {actionsSlot && <div className="flex items-center gap-2">{actionsSlot}</div>}
    </header>
  );
}
