"use client";

import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-surface-800 flex items-center justify-center mb-3 text-surface-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-surface-50">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-surface-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
