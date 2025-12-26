"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type ModulePlaceholderProps = {
  title: string;
  description: string;
  status?: string;
  ready?: string[];
  inProgress?: string[];
  planned?: string[];
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning"; children: ReactNode }) {
  const palette = {
    neutral: { background: "var(--surface-tertiary)", color: "var(--text-secondary)" },
    success: { background: "rgba(34,197,94,0.12)", color: "#15803d" },
    warning: { background: "rgba(234,179,8,0.16)", color: "#854d0e" },
  } as const;

  const styles = palette[tone];

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
      style={styles}
    >
      {children}
    </span>
  );
}

export function ModulePlaceholder({
  title,
  description,
  status = "W przygotowaniu",
  ready = [],
  inProgress = [],
  planned = [],
  cta,
  secondaryCta,
}: ModulePlaceholderProps) {
  const renderList = (items: string[], empty: string) => {
    if (!items.length) {
      return (
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          {empty}
        </p>
      );
    }

    return (
      <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: "var(--theme-primary)" }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <Badge tone="warning">{status}</Badge>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        </div>
        {(cta || secondaryCta) && (
          <div className="flex items-center gap-3">
            {cta && (
              <Link
                href={cta.href}
                className="btn-primary"
                style={{ paddingInline: "1.25rem", minWidth: "10rem", textAlign: "center" }}
              >
                {cta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="text-sm font-semibold px-4 py-2 rounded-lg border"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Już dostępne
            </div>
            <Badge tone="success">ready</Badge>
          </div>
          {renderList(ready, "Brak elementów gotowych do użycia.")}
        </div>

        <div className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              W trakcie
            </div>
            <Badge tone="warning">w toku</Badge>
          </div>
          {renderList(inProgress, "Backlog w trakcie szacowania.")}
        </div>

        <div className="rounded-xl border p-5 shadow-sm" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Zaplanowane
            </div>
            <Badge tone="neutral">backlog</Badge>
          </div>
          {renderList(planned, "Jeszcze nie zaplanowaliśmy elementów dla tego modułu.")}
        </div>
      </div>
    </div>
  );
}
