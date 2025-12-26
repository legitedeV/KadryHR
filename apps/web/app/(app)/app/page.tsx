"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useToast } from "../../providers";
import { DashboardSummary } from "./types";

const quickActions = [
  {
    label: "Otwórz grafik",
    description: "Sprawdź zmiany i opublikuj najnowszą wersję",
    href: "/schedule-builder",
  },
  {
    label: "Zarządzaj urlopami",
    description: "Potwierdź zaplanowane nieobecności zespołu",
    href: "/leaves",
  },
  {
    label: "Centrum powiadomień",
    description: "Odczytaj i zamknij zaległe alerty",
    href: "/notifications",
  },
  {
    label: "Dostępność",
    description: "Poproś zespół o deklarację dostępności",
    href: "/availability",
  },
];

export default function AppDashboardPage() {
  const { api, session } = useAuth();
  const { pushToast } = useToast();
  const orgId = session?.currentOrganization?.id;

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["dashboard", orgId],
    queryFn: () => api.get<DashboardSummary>("/dashboard"),
    enabled: Boolean(orgId),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!error) return;
    pushToast("Nie udało się załadować danych pulpitu", "error");
  }, [error, pushToast]);

  const availabilityHighlights = useMemo(() => {
    if (!data?.availability?.days?.length) return null;
    const critical = data.availability.days.find((day) => day.openSpots > 0);
    const next = data.availability.days[0];
    return { critical, next };
  }, [data?.availability?.days]);

  const renderShimmer = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-slate-200/50 rounded" />
      <div className="h-40 bg-slate-200/40 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Pulpit V2
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Podsumowanie organizacji
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Najważniejsze wskaźniki, grafiki, urlopy i powiadomienia z ostatniego tygodnia.
          </p>
        </div>
        <div className="rounded-lg border px-4 py-2 text-sm"
          style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
          <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {session?.currentOrganization?.name}
          </div>
          <div>{session?.currentOrganization?.role}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Odświeżono: {data ? formatDate(data.meta.asOf) : "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isPending && renderShimmer()}
        {!isPending && data && (
          <>
            <StatCard
              label="Aktywni pracownicy"
              value={data.stats.activeEmployees}
              hint="Wszyscy przypisani do organizacji"
            />
            <StatCard
              label="Opublikowane grafiki"
              value={data.stats.publishedSchedules}
              hint="Z ostatnich miesięcy"
            />
            <StatCard
              label="Urlopy w kolejce"
              value={data.stats.pendingLeaves}
              hint="Wymagają uwagi"
              tone="warning"
            />
            <StatCard
              label="Pokrycie zmian"
              value={`${data.stats.coverageRatio}%`}
              hint="Najbliższy tydzień"
              tone={data.stats.coverageRatio > 80 ? "success" : "warning"}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Grafiki"
          description="Status harmonogramu i najbliższe zmiany"
          actions={[
            { label: "Otwórz kreator", href: "/schedule-builder" },
            { label: "Opublikuj", href: "/schedule-builder" },
          ]}
        >
          {isPending && renderShimmer()}
          {!isPending && data && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Miesiąc {data.schedule.month}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {data.schedule.assignments} zmian w kalendarzu
                  </div>
                </div>
                <StatusPill status={data.schedule.status} />
              </div>

              <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Nadchodzące zmiany
                </div>
                {!data.schedule.upcoming.length && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Brak zaplanowanych zmian w najbliższych dniach.
                  </p>
                )}
                <div className="space-y-2">
                  {data.schedule.upcoming.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {shift.employeeName}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {formatDate(shift.date)} • {shift.start}–{shift.end}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--surface-tertiary)", color: "var(--text-secondary)" }}>
                        {shift.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Urlopy i nieobecności"
          description="Zaplanowane dni wolne i zgłoszenia"
          actions={[{ label: "Zarządzaj", href: "/leaves" }]}
        >
          {isPending && renderShimmer()}
          {!isPending && data && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  {data.leaves.pendingCount}
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Oczekujące zgłoszenia
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    wymagają potwierdzenia lub komentarza
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {data.leaves.upcoming.map((leave) => (
                  <div key={leave.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border-primary)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {leave.employeeName}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {formatDate(leave.date)}
                        </div>
                        {leave.note && (
                          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {leave.note}
                          </div>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
                        {leave.type}
                      </span>
                    </div>
                  </div>
                ))}

                {!data.leaves.upcoming.length && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Brak nowych wniosków urlopowych.
                  </p>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Powiadomienia"
          description="Alerty operacyjne i systemowe"
          actions={[{ label: "Otwórz centrum", href: "/notifications" }]}
        >
          {isPending && renderShimmer()}
          {!isPending && data && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Nieprzeczytane: {data.notifications.unread}
                </div>
                <button
                  className="text-xs underline"
                  onClick={() => refetch()}
                  style={{ color: "var(--text-secondary)" }}
                >
                  Odśwież
                </button>
              </div>

              <div className="space-y-2">
                {data.notifications.items.map((notification) => (
                  <div key={notification.id} className="rounded-lg border p-3 flex gap-3"
                    style={{ borderColor: "var(--border-primary)", background: notification.unread ? "rgba(var(--theme-primary-rgb),0.05)" : "var(--surface-secondary)" }}>
                    <div className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--surface-tertiary)", color: "var(--text-secondary)" }}>
                      {notification.category}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {notification.title}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {notification.description}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Dostępność"
          description="Pokrycie zmian na najbliższe 7 dni"
          actions={[{ label: "Zaplanuj", href: "/availability" }]}
        >
          {isPending && renderShimmer()}
          {!isPending && data && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    {data.availability.coverageRatio}%
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Pokrycie {data.availability.scheduledEmployees}/{data.availability.activeEmployees} osób
                  </div>
                </div>
                {availabilityHighlights?.critical ? (
                  <div className="rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                    Braki: {formatDate(availabilityHighlights.critical.date)} ({availabilityHighlights.critical.openSpots} miejsc)
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Brak braków w grafiku
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {data.availability.days.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <div className="w-28 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(day.date)}
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200/40">
                      <div
                        className="h-full"
                        style={{
                          width: `${data.availability.activeEmployees ? (Math.min(day.scheduledCount, data.availability.activeEmployees) / data.availability.activeEmployees) * 100 : 0}%`,
                          background: "var(--theme-primary)",
                        }}
                      />
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {day.scheduledCount} / {data.availability.activeEmployees}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Szybkie akcje"
          description="Najczęstsze skróty operacyjne"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-xl border p-4 hover:shadow-sm transition"
                style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}
              >
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {action.label}
                </div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {action.description}
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "success" | "warning";
}) {
  const tones = {
    default: {
      background: "var(--surface-secondary)",
      color: "var(--text-primary)",
    },
    success: {
      background: "rgba(34,197,94,0.08)",
      color: "var(--text-primary)",
    },
    warning: {
      background: "rgba(234,179,8,0.1)",
      color: "var(--text-primary)",
    },
  } as const;

  const palette = tones[tone];

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-primary)", background: palette.background }}>
      <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </div>
      <div className="text-3xl font-semibold" style={{ color: palette.color }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {hint}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: Array<{ label: string; href: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border shadow-sm h-full flex flex-col"
      style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
      <div className="p-4 border-b flex items-center justify-between gap-3"
        style={{ borderColor: "var(--border-primary)" }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {description}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions?.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="text-xs px-3 py-1 rounded-md border"
              style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const palette =
    status === "PUBLISHED"
      ? { bg: "rgba(34,197,94,0.12)", color: "#16a34a", label: "Opublikowany" }
      : { bg: "rgba(234,179,8,0.12)", color: "#b45309", label: "Roboczy" };

  return (
    <span
      className="text-xs px-3 py-1 rounded-full font-semibold"
      style={{ background: palette.bg, color: palette.color }}
    >
      {palette.label}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
