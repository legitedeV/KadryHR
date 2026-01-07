"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import {
  apiGetMe,
  apiGetActiveAvailabilityWindows,
  apiGetAvailability,
  apiBulkUpsertAvailability,
  AvailabilityWindowRecord,
  AvailabilityRecord,
  AvailabilityInput,
  User,
  Weekday,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "MONDAY", label: "Poniedziałek" },
  { key: "TUESDAY", label: "Wtorek" },
  { key: "WEDNESDAY", label: "Środa" },
  { key: "THURSDAY", label: "Czwartek" },
  { key: "FRIDAY", label: "Piątek" },
  { key: "SATURDAY", label: "Sobota" },
  { key: "SUNDAY", label: "Niedziela" },
];

interface DayAvailability {
  weekday: Weekday;
  slots: Array<{ start: string; end: string }>;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
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

export default function DyspozycjePage() {
  const router = useRouter();
  const hasSession = useMemo(() => !!getAccessToken(), []);
  const [user, setUser] = useState<User | null>(null);
  const [windows, setWindows] = useState<AvailabilityWindowRecord[]>([]);
  const [currentAvailability, setCurrentAvailability] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - one array per weekday
  const [formData, setFormData] = useState<DayAvailability[]>(
    WEEKDAYS.map((w) => ({ weekday: w.key, slots: [] }))
  );

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([
      apiGetMe(),
      apiGetActiveAvailabilityWindows(),
      apiGetAvailability({}),
    ])
      .then(([userData, windowsData, availabilityData]) => {
        if (cancelled) return;

        setUser(userData);
        setWindows(windowsData);
        setCurrentAvailability(availabilityData);

        // Initialize form with existing availability
        const newFormData = WEEKDAYS.map((w) => {
          const dayAvail = availabilityData.filter((a) => a.weekday === w.key);
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

  const activeWindow = windows.length > 0 ? windows[0] : null;

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

  const handleSave = useCallback(async () => {
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

    // Convert to availability inputs
    const availabilities: AvailabilityInput[] = formData.flatMap((day) =>
      day.slots.map((slot) => ({
        weekday: day.weekday,
        startMinutes: parseTime(slot.start),
        endMinutes: parseTime(slot.end),
      }))
    );

    setSaving(true);
    try {
      await apiBulkUpsertAvailability({ availabilities });
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

  if (!hasSession) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Ładowanie dyspozycji...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label">Grafik</p>
        <p className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-1">
          Twoja dyspozycyjność
        </p>
      </div>

      {/* Active Window Banner */}
      {activeWindow ? (
        <div className="card p-5 border-l-4 border-l-brand-500">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-success">Otwarte</span>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                  {activeWindow.title}
                </h3>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-300">
                Okres: {formatDate(activeWindow.startDate)} – {formatDate(activeWindow.endDate)}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Termin składania: {formatDate(activeWindow.deadline)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5 border-l-4 border-l-surface-300 dark:border-l-surface-600">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 dark:text-surface-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-surface-700 dark:text-surface-300">
                Składanie dyspozycji zamknięte
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Aktualnie nie ma otwartego okresu składania dyspozycji. Możesz jednak edytować swoją domyślną dostępność.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Availability Form */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="section-label">Preferowane godziny pracy</p>
            <p className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">
              Domyślna tygodniowa dostępność
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {WEEKDAYS.map(({ key, label }) => {
            const dayData = formData.find((d) => d.weekday === key);
            const slots = dayData?.slots || [];

            return (
              <div
                key={key}
                className="rounded-xl border border-surface-200/80 dark:border-surface-700/80 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-surface-900 dark:text-surface-50">
                    {label}
                  </span>
                  <button
                    type="button"
                    className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                    onClick={() => addSlot(key)}
                  >
                    + Dodaj przedział
                  </button>
                </div>

                {slots.length === 0 ? (
                  <div className="text-sm text-surface-400 dark:text-surface-500 py-2">
                    Brak podanej dostępności – kliknij „Dodaj przedział"
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="flex items-center gap-3 bg-surface-50/50 dark:bg-surface-800/50 rounded-lg px-3 py-2"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <span className="text-surface-500 dark:text-surface-400">od</span>
                          <input
                            type="time"
                            className="input py-1.5 px-2 text-sm"
                            value={slot.start}
                            onChange={(e) =>
                              updateSlot(key, slotIndex, "start", e.target.value)
                            }
                          />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <span className="text-surface-500 dark:text-surface-400">do</span>
                          <input
                            type="time"
                            className="input py-1.5 px-2 text-sm"
                            value={slot.end}
                            onChange={(e) =>
                              updateSlot(key, slotIndex, "end", e.target.value)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="ml-auto text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1"
                          onClick={() => removeSlot(key, slotIndex)}
                          aria-label="Usuń przedział"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz dyspozycje"}
          </button>
        </div>
      </div>
    </div>
  );
}
