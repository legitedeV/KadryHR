"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import {
  apiGetMe,
  apiGetActiveAvailabilityWindows,
  apiGetMyAvailability,
  apiUpdateMyAvailability,
  apiGetTeamAvailability,
  apiGetTeamAvailabilityStats,
  apiGetEmployeeAvailability,
  apiUpdateEmployeeAvailability,
  apiListLocations,
  apiCreateAvailabilityWindow,
  AvailabilityWindowRecord,
  AvailabilityRecord,
  AvailabilityInput,
  User,
  Weekday,
  EmployeeAvailabilitySummary,
  TeamAvailabilityStatsResponse,
  EmployeeAvailabilityDetailResponse,
  LocationRecord,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";

const WEEKDAYS: { key: Weekday; label: string; shortLabel: string }[] = [
  { key: "MONDAY", label: "Poniedziałek", shortLabel: "Pon" },
  { key: "TUESDAY", label: "Wtorek", shortLabel: "Wt" },
  { key: "WEDNESDAY", label: "Środa", shortLabel: "Śr" },
  { key: "THURSDAY", label: "Czwartek", shortLabel: "Cz" },
  { key: "FRIDAY", label: "Piątek", shortLabel: "Pt" },
  { key: "SATURDAY", label: "Sobota", shortLabel: "So" },
  { key: "SUNDAY", label: "Niedziela", shortLabel: "Nd" },
];

interface DayAvailability {
  weekday: Weekday;
  slots: Array<{ start: string; end: string }>;
}

type ActiveTab = "my" | "team";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isAdmin(role: string): boolean {
  return role === "OWNER" || role === "MANAGER" || role === "ADMIN";
}

// Loading skeleton for availability card
function AvailabilitySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-surface-200/80 dark:border-surface-700/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-24 bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="h-4 w-20 bg-surface-200 dark:bg-surface-700 rounded" />
          </div>
          <div className="h-10 w-full bg-surface-100 dark:bg-surface-800 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Team table skeleton
function TeamTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-surface-100 dark:bg-surface-800 rounded-t-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 border-b border-surface-200/80 dark:border-surface-700/80 flex items-center px-4 gap-4">
          <div className="h-10 w-10 bg-surface-200 dark:bg-surface-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-surface-200 dark:bg-surface-700 rounded mb-2" />
            <div className="h-3 w-24 bg-surface-100 dark:bg-surface-800 rounded" />
          </div>
          <div className="h-6 w-16 bg-surface-200 dark:bg-surface-700 rounded" />
        </div>
      ))}
    </div>
  );
}

// Availability Window Status Card
function WindowStatusCard({
  window,
  isAdmin: adminView,
  onOpenWindow,
}: {
  window: AvailabilityWindowRecord | null;
  isAdmin: boolean;
  onOpenWindow?: () => void;
}) {
  if (window) {
    return (
      <div className="card p-5 border-l-4 border-l-emerald-500">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-success">Otwarte</span>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                {window.title}
              </h3>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Okres: {formatDateShort(window.startDate)} – {formatDateShort(window.endDate)}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Termin: {formatDate(window.deadline)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 border-l-4 border-l-surface-300 dark:border-l-surface-600">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 dark:text-surface-500 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-surface-700 dark:text-surface-300">
            Składanie dyspozycji zamknięte
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Aktualnie nie ma otwartego okresu składania dyspozycji.
            {!adminView && " Możesz jednak edytować swoją domyślną dostępność."}
          </p>
          {adminView && onOpenWindow && (
            <button
              onClick={onOpenWindow}
              className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              + Otwórz okno składania dyspozycji
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// My Availability Tab Component
function MyAvailabilityTab({
  formData,
  setFormData,
  saving,
  onSave,
}: {
  formData: DayAvailability[];
  setFormData: React.Dispatch<React.SetStateAction<DayAvailability[]>>;
  saving: boolean;
  onSave: () => Promise<void>;
}) {
  const [selectedDay, setSelectedDay] = useState<Weekday>("MONDAY");
  const addSlot = (weekday: Weekday) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        return {
          ...day,
          slots: [...day.slots, { start: "08:00", end: "16:00" }],
        };
      })
    );
  };

  const updateSlot = (
    weekday: Weekday,
    slotIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        const newSlots = [...day.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...day, slots: newSlots };
      })
    );
  };

  const removeSlot = (weekday: Weekday, slotIndex: number) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        return {
          ...day,
          slots: day.slots.filter((_, i) => i !== slotIndex),
        };
      })
    );
  };

  const selectedData = formData.find((day) => day.weekday === selectedDay);
  const selectedLabel = WEEKDAYS.find((day) => day.key === selectedDay)?.label ?? "Dzień";
  const selectedSlots = selectedData?.slots ?? [];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.02em] text-slate-500">Dyspozycje</p>
          <p className="text-base font-semibold text-surface-900 dark:text-surface-50 mt-1">
            Domyślna tygodniowa dostępność
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-3">
          {WEEKDAYS.map(({ key, label }) => {
            const dayData = formData.find((d) => d.weekday === key);
            const slots = dayData?.slots || [];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selectedDay === key
                    ? "border-brand-300 bg-brand-50/50 shadow-sm dark:border-brand-700/60 dark:bg-brand-950/40"
                    : "border-surface-200 bg-white hover:border-brand-200 dark:border-surface-800 dark:bg-surface-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-surface-900 dark:text-surface-50">{label}</span>
                  <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-surface-500 dark:bg-surface-800 dark:text-surface-300">
                    {slots.length === 0 ? "Niedostępny" : `${slots.length} okna`}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {slots.length === 0 ? (
                    <span className="text-xs text-surface-400">Brak godzin</span>
                  ) : (
                    slots.map((slot, slotIndex) => (
                      <span
                        key={slotIndex}
                        className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-semibold text-surface-600 dark:bg-surface-800 dark:text-surface-300"
                      >
                        {slot.start}–{slot.end}
                      </span>
                    ))
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-surface-200/80 bg-surface-50/60 p-5 dark:border-surface-800/60 dark:bg-surface-900/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.02em] text-slate-500">Edytuj dzień</p>
              <p className="text-base font-semibold text-surface-900 dark:text-surface-50">{selectedLabel}</p>
            </div>
            <button
              type="button"
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium flex items-center gap-1"
              onClick={() => addSlot(selectedDay)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Dodaj przedział
            </button>
          </div>

          {selectedSlots.length === 0 ? (
            <div className="text-sm text-surface-400 dark:text-surface-500 py-6 px-4 bg-white/70 dark:bg-surface-800/40 rounded-2xl text-center">
              Brak podanej dostępności
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedSlots.map((slot, slotIndex) => (
                <div
                  key={slotIndex}
                  className="flex flex-wrap items-center gap-3 bg-white dark:bg-surface-800/60 rounded-2xl px-4 py-3 border border-surface-200/80 dark:border-surface-700/80"
                >
                  <input
                    type="time"
                    className="input py-1 px-2 text-sm w-28"
                    value={slot.start}
                    onChange={(e) => updateSlot(selectedDay, slotIndex, "start", e.target.value)}
                  />
                  <span className="text-surface-400 dark:text-surface-500">–</span>
                  <input
                    type="time"
                    className="input py-1 px-2 text-sm w-28"
                    value={slot.end}
                    onChange={(e) => updateSlot(selectedDay, slotIndex, "end", e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    onClick={() => removeSlot(selectedDay, slotIndex)}
                    aria-label="Usuń przedział"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-surface-200/80 dark:border-surface-700/80">
            <button className="btn-primary" onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Zapisywanie...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Zapisz dyspozycje
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Team Availability Tab Component
function TeamAvailabilityTab({
  stats,
  employees,
  locations,
  filters,
  setFilters,
  loading,
  onEmployeeClick,
}: {
  stats: TeamAvailabilityStatsResponse | null;
  employees: EmployeeAvailabilitySummary[];
  locations: LocationRecord[];
  filters: { search: string; locationId: string; role: string };
  setFilters: React.Dispatch<React.SetStateAction<{ search: string; locationId: string; role: string }>>;
  loading: boolean;
  onEmployeeClick: (employeeId: string) => void;
}) {
  if (loading) {
    return <TeamTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {stats.totalEmployees}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Pracowników</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.employeesWithAvailability}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Z dyspozycją</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.employeesWithoutAvailability}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Bez dyspozycji</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Szukaj pracownika..."
                className="input pl-10"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
          </div>
          <select
            className="input w-full sm:w-48"
            value={filters.locationId}
            onChange={(e) => setFilters((f) => ({ ...f, locationId: e.target.value }))}
          >
            <option value="">Wszystkie lokalizacje</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <select
            className="input w-full sm:w-40"
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="">Wszystkie role</option>
            <option value="OWNER">Właściciel</option>
            <option value="MANAGER">Menedżer</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Pracownik</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card overflow-hidden">
        {employees.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Brak pracowników"
            description="Nie znaleziono pracowników pasujących do kryteriów"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200/80 dark:border-surface-700/80">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Pracownik
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Stanowisko
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Lokalizacje
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Status
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/80 dark:divide-surface-700/80">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer"
                    onClick={() => onEmployeeClick(emp.id)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/50 dark:to-brand-800/50 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-surface-50">
                            {emp.firstName} {emp.lastName}
                          </p>
                          {emp.email && (
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                              {emp.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-surface-600 dark:text-surface-300">
                      {emp.position || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {emp.locations.slice(0, 2).map((loc) => (
                          <span key={loc.id} className="badge badge-neutral text-xs">
                            {loc.name}
                          </span>
                        ))}
                        {emp.locations.length > 2 && (
                          <span className="badge badge-neutral text-xs">
                            +{emp.locations.length - 2}
                          </span>
                        )}
                        {emp.locations.length === 0 && (
                          <span className="text-sm text-surface-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {emp.hasWeeklyDefault ? (
                        <span className="badge badge-success">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Podana
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                          </svg>
                          Brak
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmployeeClick(emp.id);
                        }}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Edytuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Employee Detail Side Panel
function EmployeeDetailPanel({
  open,
  employee,
  availability,
  loading,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  employee: EmployeeAvailabilityDetailResponse["employee"] | null;
  availability: AvailabilityRecord[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (availabilities: AvailabilityInput[]) => Promise<void>;
}) {
  // Compute initial form data from availability
  const initialFormData = useMemo(() => {
    if (availability.length > 0) {
      return WEEKDAYS.map((w) => {
        const dayAvail = availability.filter((a) => a.weekday === w.key);
        return {
          weekday: w.key,
          slots: dayAvail.map((a) => ({
            start: formatMinutes(a.startMinutes),
            end: formatMinutes(a.endMinutes),
          })),
        };
      });
    }
    return WEEKDAYS.map((w) => ({ weekday: w.key, slots: [] }));
  }, [availability]);

  const [formData, setFormData] = useState<DayAvailability[]>(initialFormData);

  // Reset form when availability changes (using a key to track changes)
  const availabilityKey = useMemo(() => 
    availability.map(a => `${a.id}-${a.weekday}-${a.startMinutes}-${a.endMinutes}`).join(','),
    [availability]
  );
  
  useEffect(() => {
    setFormData(initialFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityKey]);

  const handleSave = async () => {
    // Validate slots
    for (const day of formData) {
      for (const slot of day.slots) {
        const startMins = parseTime(slot.start);
        const endMins = parseTime(slot.end);
        if (startMins >= endMins) {
          pushToast({
            title: "Błąd",
            description: `Godzina początkowa musi być przed godziną końcową (${WEEKDAYS.find((w) => w.key === day.weekday)?.label})`,
            variant: "error",
          });
          return;
        }
      }
    }

    const availabilities: AvailabilityInput[] = formData.flatMap((day) =>
      day.slots.map((slot) => ({
        weekday: day.weekday,
        startMinutes: parseTime(slot.start),
        endMinutes: parseTime(slot.end),
      }))
    );

    await onSave(availabilities);
  };

  const addSlot = (weekday: Weekday) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        return { ...day, slots: [...day.slots, { start: "08:00", end: "16:00" }] };
      })
    );
  };

  const updateSlot = (weekday: Weekday, slotIndex: number, field: "start" | "end", value: string) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        const newSlots = [...day.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...day, slots: newSlots };
      })
    );
  };

  const removeSlot = (weekday: Weekday, slotIndex: number) => {
    setFormData((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        return { ...day, slots: day.slots.filter((_, i) => i !== slotIndex) };
      })
    );
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      title={employee ? `${employee.firstName} ${employee.lastName}` : "Ładowanie..."}
      description={employee?.position || employee?.email || undefined}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </>
      }
    >
      {loading ? (
        <AvailabilitySkeleton />
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {WEEKDAYS.map(({ key, label }) => {
            const dayData = formData.find((d) => d.weekday === key);
            const slots = dayData?.slots || [];

            return (
              <div key={key} className="rounded-lg border border-surface-200/80 dark:border-surface-700/80 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-surface-900 dark:text-surface-50">{label}</span>
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                    onClick={() => addSlot(key)}
                  >
                    + Dodaj
                  </button>
                </div>
                {slots.length === 0 ? (
                  <p className="text-xs text-surface-400 py-2">Brak dostępności</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          className="input py-1 px-2 text-sm w-24"
                          value={slot.start}
                          onChange={(e) => updateSlot(key, idx, "start", e.target.value)}
                        />
                        <span className="text-surface-400">–</span>
                        <input
                          type="time"
                          className="input py-1 px-2 text-sm w-24"
                          value={slot.end}
                          onChange={(e) => updateSlot(key, idx, "end", e.target.value)}
                        />
                        <button
                          type="button"
                          className="text-rose-500 hover:text-rose-600 p-1"
                          onClick={() => removeSlot(key, idx)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// Create Window Modal
function CreateWindowModal({
  open,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; startDate: string; endDate: string; deadline: string }) => Promise<void>;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "Składanie dyspozycji",
    startDate: "",
    endDate: "",
    deadline: "",
  });

  const handleSubmit = () => {
    if (!formData.startDate || !formData.endDate || !formData.deadline) {
      pushToast({ title: "Błąd", description: "Wypełnij wszystkie pola", variant: "error" });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal
      open={open}
      title="Otwórz okno składania dyspozycji"
      description="Ustaw okres, na który pracownicy mają podać swoją dostępność"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Tworzenie..." : "Utwórz okno"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Tytuł
          </label>
          <input
            type="text"
            className="input"
            value={formData.title}
            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Data początkowa
            </label>
            <input
              type="date"
              className="input"
              value={formData.startDate}
              onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Data końcowa
            </label>
            <input
              type="date"
              className="input"
              value={formData.endDate}
              onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Termin składania
          </label>
          <input
            type="date"
            className="input"
            value={formData.deadline}
            onChange={(e) => setFormData((f) => ({ ...f, deadline: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function DyspozycjePage() {
  const router = useRouter();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("my");
  const [windows, setWindows] = useState<AvailabilityWindowRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // My availability state
  const [formData, setFormData] = useState<DayAvailability[]>(
    WEEKDAYS.map((w) => ({ weekday: w.key, slots: [] }))
  );

  // Team availability state
  const [teamStats, setTeamStats] = useState<TeamAvailabilityStatsResponse | null>(null);
  const [employees, setEmployees] = useState<EmployeeAvailabilitySummary[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", locationId: "", role: "" });

  // Employee detail panel state
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAvailabilityDetailResponse | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeSaving, setEmployeeSaving] = useState(false);

  // Create window modal state
  const [createWindowOpen, setCreateWindowOpen] = useState(false);
  const [creatingWindow, setCreatingWindow] = useState(false);

  const activeWindow = windows.length > 0 ? windows[0] : null;
  const userIsAdmin = user ? isAdmin(user.role) : false;

  // Initial data load
  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([
      apiGetMe(),
      apiGetActiveAvailabilityWindows(),
      apiGetMyAvailability(),
      apiListLocations(),
    ])
      .then(([userData, windowsData, myAvailData, locationsData]) => {
        if (cancelled) return;

        setUser(userData);
        setWindows(windowsData);
        setLocations(locationsData);

        // Initialize form with existing availability
        const newFormData = WEEKDAYS.map((w) => {
          const dayAvail = myAvailData.availability.filter((a) => a.weekday === w.key);
          return {
            weekday: w.key,
            slots: dayAvail.map((a) => ({
              start: formatMinutes(a.startMinutes),
              end: formatMinutes(a.endMinutes),
            })),
          };
        });
        setFormData(newFormData);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Nie udało się pobrać danych");
          clearAuthTokens();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession, router]);

  // Load team data when switching to team tab
  useEffect(() => {
    if (activeTab === "team" && userIsAdmin && !teamStats) {
      loadTeamData();
    }
  }, [activeTab, userIsAdmin, teamStats]);

  const loadTeamData = async () => {
    setTeamLoading(true);
    try {
      const [statsData, employeesData] = await Promise.all([
        apiGetTeamAvailabilityStats(),
        apiGetTeamAvailability({ page: 1, perPage: 50 }),
      ]);
      setTeamStats(statsData);
      setEmployees(employeesData.data);
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się pobrać danych zespołu", variant: "error" });
    } finally {
      setTeamLoading(false);
    }
  };

  const loadTeamEmployees = useCallback(async () => {
    if (!userIsAdmin) return;
    setTeamLoading(true);
    try {
      const data = await apiGetTeamAvailability({
        search: filters.search || undefined,
        locationId: filters.locationId || undefined,
        role: filters.role || undefined,
        page: 1,
        perPage: 50,
      });
      setEmployees(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setTeamLoading(false);
    }
  }, [userIsAdmin, filters.search, filters.locationId, filters.role]);

  // Reload team employees when filters change
  useEffect(() => {
    if (activeTab === "team" && userIsAdmin) {
      loadTeamEmployees();
    }
  }, [activeTab, userIsAdmin, loadTeamEmployees]);

  const handleSaveMyAvailability = useCallback(async () => {
    // Validate slots
    for (const day of formData) {
      for (const slot of day.slots) {
        const startMins = parseTime(slot.start);
        const endMins = parseTime(slot.end);
        if (startMins >= endMins) {
          pushToast({
            title: "Błąd",
            description: `Godzina początkowa musi być przed godziną końcową (${WEEKDAYS.find((w) => w.key === day.weekday)?.label})`,
            variant: "error",
          });
          return;
        }
      }
    }

    const availabilities: AvailabilityInput[] = formData.flatMap((day) =>
      day.slots.map((slot) => ({
        weekday: day.weekday,
        startMinutes: parseTime(slot.start),
        endMinutes: parseTime(slot.end),
      }))
    );

    setSaving(true);
    try {
      await apiUpdateMyAvailability(availabilities);
      pushToast({
        title: "Sukces",
        description: "Dyspozycje zostały zapisane",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      pushToast({
        title: "Błąd",
        description: "Nie udało się zapisać dyspozycji",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [formData]);

  const handleEmployeeClick = async (employeeId: string) => {
    setEmployeeLoading(true);
    setSelectedEmployee(null);
    try {
      const data = await apiGetEmployeeAvailability(employeeId);
      setSelectedEmployee(data);
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się pobrać danych pracownika", variant: "error" });
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleSaveEmployeeAvailability = async (availabilities: AvailabilityInput[]) => {
    if (!selectedEmployee) return;
    setEmployeeSaving(true);
    try {
      await apiUpdateEmployeeAvailability(selectedEmployee.employee.id, availabilities);
      pushToast({ title: "Sukces", description: "Dyspozycje pracownika zostały zapisane", variant: "success" });
      setSelectedEmployee(null);
      // Reload team data
      loadTeamData();
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się zapisać dyspozycji", variant: "error" });
    } finally {
      setEmployeeSaving(false);
    }
  };

  const handleCreateWindow = async (data: { title: string; startDate: string; endDate: string; deadline: string }) => {
    setCreatingWindow(true);
    try {
      const newWindow = await apiCreateAvailabilityWindow({
        title: data.title,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        deadline: new Date(data.deadline).toISOString(),
        isOpen: true,
      });
      setWindows([newWindow, ...windows]);
      setCreateWindowOpen(false);
      pushToast({ title: "Sukces", description: "Okno składania dyspozycji zostało utworzone", variant: "success" });
    } catch (err) {
      console.error(err);
      pushToast({ title: "Błąd", description: "Nie udało się utworzyć okna", variant: "error" });
    } finally {
      setCreatingWindow(false);
    }
  };

  if (!hasSession) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Ładowanie dyspozycji...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">Dyspozycje</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Zarządzaj dostępnością {userIsAdmin ? "swojego zespołu" : "swoją"} do układania grafiku pracy
          </p>
        </div>
        {userIsAdmin && (
          <div className="flex items-center gap-2">
            {!activeWindow && (
              <button
                onClick={() => setCreateWindowOpen(true)}
                className="btn-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Otwórz okno dyspozycji
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs (only for admins) */}
      {userIsAdmin && (
        <div className="flex gap-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("my")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "my"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Moja dyspozycyjność
              </span>
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "team"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Dyspozycyjność zespołu
              </span>
            </button>
        </div>
      )}

      {/* Availability Window Status */}
      <WindowStatusCard
        window={activeWindow}
        isAdmin={userIsAdmin}
        onOpenWindow={() => setCreateWindowOpen(true)}
      />

      {/* Tab Content */}
      {activeTab === "my" ? (
        <MyAvailabilityTab
          formData={formData}
          setFormData={setFormData}
          saving={saving}
          onSave={handleSaveMyAvailability}
        />
      ) : (
        <TeamAvailabilityTab
          stats={teamStats}
          employees={employees}
          locations={locations}
          filters={filters}
          setFilters={setFilters}
          loading={teamLoading}
          onEmployeeClick={handleEmployeeClick}
        />
      )}

      {/* Employee Detail Panel */}
      <EmployeeDetailPanel
        open={!!selectedEmployee || employeeLoading}
        employee={selectedEmployee?.employee || null}
        availability={selectedEmployee?.availability || []}
        loading={employeeLoading}
        saving={employeeSaving}
        onClose={() => setSelectedEmployee(null)}
        onSave={handleSaveEmployeeAvailability}
      />

      {/* Create Window Modal */}
      <CreateWindowModal
        open={createWindowOpen}
        onClose={() => setCreateWindowOpen(false)}
        onSubmit={handleCreateWindow}
        saving={creatingWindow}
      />
    </div>
  );
}
