import type { ReactNode } from "react";
import { cn } from "../utils";

export function KadryCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-900/5",
        className
      )}
    >
      {title ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-emerald-950">{title}</h3>
          {description ? (
            <p className="text-sm text-emerald-700/80">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
