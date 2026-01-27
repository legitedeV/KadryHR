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
    <div className="flex flex-col items-center justify-center py-10 text-center border border-surface-300 bg-surface-50 rounded-md px-6">
      {icon && (
        <div className="h-12 w-12 rounded-md bg-surface-100 flex items-center justify-center mb-3 text-surface-600">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-surface-900">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-surface-600">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
