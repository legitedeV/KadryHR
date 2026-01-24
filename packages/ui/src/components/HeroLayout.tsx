import type { ReactNode } from "react";
import { cn } from "../utils";

export function HeroLayout({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pb-12 pt-16 sm:pt-24", className)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h1 className="text-4xl font-semibold text-emerald-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg text-emerald-800/80">{description}</p>
          {actions ? <div className="mt-8 flex flex-wrap gap-4">{actions}</div> : null}
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </section>
  );
}
