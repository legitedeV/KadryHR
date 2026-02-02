import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={`min-h-screen bg-[var(--body-gradient)] text-[var(--body-text)] ${className ?? ""}`}>
      <div className="page-shell-inner">{children}</div>
    </div>
  );
}
