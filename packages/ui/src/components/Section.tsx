import type { ReactNode } from "react";
import { cn } from "../utils";

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-20", className)}>
      <div className="mx-auto w-full max-w-6xl px-6">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="mt-3 text-3xl font-semibold text-emerald-950 sm:text-4xl">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="mt-4 max-w-2xl text-base text-emerald-800/80">
            {description}
          </p>
        ) : null}
        <div className={cn("mt-10", title || description ? "" : "mt-0")}>
          {children}
        </div>
      </div>
    </section>
  );
}
