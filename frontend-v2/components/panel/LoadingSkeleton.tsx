"use client";

type LoadingSkeletonProps = {
  lines?: number;
  className?: string;
};

export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-4 w-full rounded-md bg-surface-100 skeleton-shimmer"
        />
      ))}
    </div>
  );
}
