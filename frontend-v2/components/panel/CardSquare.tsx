"use client";

import type { ReactNode } from "react";

type CardSquareProps = {
  title?: string;
  description?: string;
  actionSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function CardSquare({ title, description, actionSlot, children, className }: CardSquareProps) {
  return (
    <section
      className={`border border-[var(--border-soft)] bg-[var(--bg-card)] rounded-md shadow-[0_1px_2px_rgba(31,41,55,0.06)] ${
        className ?? ""
      }`}
    >
      {(title || description || actionSlot) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--border-soft)]">
          <div>
            {title && <h3 className="text-sm font-semibold text-[var(--text-main)]">{title}</h3>}
            {description && <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>}
          </div>
          {actionSlot && <div className="shrink-0">{actionSlot}</div>}
        </div>
      )}
      {children && <div className="px-5 py-4">{children}</div>}
    </section>
  );
}
