"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/api-client";
import { getAuthTokens } from "@/lib/auth";
import { apiListLocations, LocationRecord } from "@/lib/api";

export default function RaportyPage() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [scheduleFrom, setScheduleFrom] = useState("");
  const [scheduleTo, setScheduleTo] = useState("");
  const [scheduleLocationId, setScheduleLocationId] = useState("");
  const [hoursFrom, setHoursFrom] = useState("");
  const [hoursTo, setHoursTo] = useState("");
  const [hoursLocationId, setHoursLocationId] = useState("");
  const [leavesFrom, setLeavesFrom] = useState("");
  const [leavesTo, setLeavesTo] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiListLocations()
      .then((data) => {
        if (!mounted) return;
        setLocations(data);
      })
      .catch(() => {
        if (!mounted) return;
        setLocations([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function downloadReport(
    type: "schedule" | "leaves" | "hours",
    from: string,
    to: string,
    locationId?: string,
  ) {
    if (!from || !to) {
      pushToast({
        variant: "error",
        title: "Proszę wybrać zakres dat",
      });
      return;
    }

    // Validate dates
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      pushToast({
        variant: "error",
        title: "Nieprawidłowy format daty",
      });
      return;
    }

    if (fromDate > toDate) {
      pushToast({
        variant: "error",
        title: "Data początkowa musi być wcześniejsza niż data końcowa",
      });
      return;
    }

    try {
      setLoading(type);
      const tokens = getAuthTokens();
      const params = new URLSearchParams({ from, to, format: "csv" });
      if (locationId) {
        params.set("locationId", locationId);
      }
      const url = `${API_BASE_URL}/reports/${type}?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Błąd pobierania raportu");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${type}-report-${from}-${to}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      pushToast({
        variant: "success",
        title: "Raport został pobrany",
      });
    } catch (error) {
      console.error(error);
      pushToast({
        variant: "error",
        title: "Nie udało się pobrać raportu",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card p-6">
        <h1 className="text-2xl font-bold text-surface-50">Raporty</h1>
        <p className="text-sm text-surface-400 mt-1">
          Generuj i pobieraj raporty z systemu
        </p>
      </div>

      {/* Schedule Report */}
      <div className="panel-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-50">Raport grafiku zmian</h2>
            <p className="text-sm text-surface-400 mt-1">
              Eksportuj listę zmian wraz z godzinami pracy
            </p>
          </div>
          <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Data początkowa
            </label>
            <input
              type="date"
              value={scheduleFrom}
              onChange={(e) => setScheduleFrom(e.target.value)}
              className="panel-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Data końcowa
            </label>
            <input
              type="date"
              value={scheduleTo}
              onChange={(e) => setScheduleTo(e.target.value)}
              className="panel-input w-full"
            />
          </div>
        </div>
        {locations.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Lokalizacja (opcjonalnie)
            </label>
            <select
              className="panel-input w-full"
              value={scheduleLocationId}
              onChange={(e) => setScheduleLocationId(e.target.value)}
            >
              <option value="">Wszystkie lokalizacje</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={() =>
            downloadReport("schedule", scheduleFrom, scheduleTo, scheduleLocationId)
          }
          disabled={loading === "schedule"}
          className="btn-primary px-4 py-2"
        >
          {loading === "schedule" ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2 inline-block" />
              Generowanie...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Pobierz raport CSV
            </>
          )}
        </button>
      </div>

      {/* Hours Report */}
      <div className="panel-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-50">Raport godzin pracy</h2>
            <p className="text-sm text-surface-400 mt-1">
              Suma godzin na pracownika w wybranym okresie
            </p>
          </div>
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Data początkowa
            </label>
            <input
              type="date"
              value={hoursFrom}
              onChange={(e) => setHoursFrom(e.target.value)}
              className="panel-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Data końcowa
            </label>
            <input
              type="date"
              value={hoursTo}
              onChange={(e) => setHoursTo(e.target.value)}
              className="panel-input w-full"
            />
          </div>
        </div>
        {locations.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Lokalizacja (opcjonalnie)
            </label>
            <select
              className="panel-input w-full"
              value={hoursLocationId}
              onChange={(e) => setHoursLocationId(e.target.value)}
            >
              <option value="">Wszystkie lokalizacje</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={() => downloadReport("hours", hoursFrom, hoursTo, hoursLocationId)}
          disabled={loading === "hours"}
          className="btn-primary px-4 py-2"
        >
          {loading === "hours" ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2 inline-block" />
              Generowanie...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Pobierz raport CSV
            </>
          )}
        </button>
      </div>

      {/* Leaves Report */}
      <div className="panel-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-50">Raport wniosków urlopowych</h2>
            <p className="text-sm text-surface-400 mt-1">
              Eksportuj listę wniosków urlopowych dla wybranego okresu
            </p>
          </div>
          <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Data początkowa
            </label>
            <input
              type="date"
              value={leavesFrom}
              onChange={(e) => setLeavesFrom(e.target.value)}
              className="panel-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Data końcowa
            </label>
            <input
              type="date"
              value={leavesTo}
              onChange={(e) => setLeavesTo(e.target.value)}
              className="panel-input w-full"
            />
          </div>
        </div>
        <button
          onClick={() => downloadReport("leaves", leavesFrom, leavesTo, undefined)}
          disabled={loading === "leaves"}
          className="btn-primary px-4 py-2"
        >
          {loading === "leaves" ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2 inline-block" />
              Generowanie...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Pobierz raport CSV
            </>
          )}
        </button>
      </div>

      {/* Info Card */}
      <div className="panel-card p-6 border-l-4 border-brand-500">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-surface-50">Informacje o raportach</h3>
            <p className="text-sm text-surface-400 mt-1">
              Raporty są generowane w formacie CSV i mogą być otwarte w arkuszach kalkulacyjnych.
              Wybierz zakres dat i kliknij przycisk pobierania, aby wygenerować raport.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
