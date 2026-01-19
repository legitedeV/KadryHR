"use client";

export default function ConsoleLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Logs & Errors</h1>
        <p className="text-sm text-surface-400 mt-1">
          Bezpieczny inspektor logów z filtrowaniem. Backend zostanie podłączony do magazynu logów,
          aby prezentować zdarzenia biznesowe bez wrażliwych danych.
        </p>
      </div>

      <div className="panel-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-100">Filtry</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-xs text-surface-400">
            Service
            <select className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100">
              <option>backend</option>
              <option>worker</option>
              <option>frontend</option>
            </select>
          </label>
          <label className="text-xs text-surface-400">
            Level
            <select className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100">
              <option>error</option>
              <option>warn</option>
              <option>info</option>
            </select>
          </label>
          <label className="text-xs text-surface-400">
            Zakres czasu
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              placeholder="Ostatnie 24h"
            />
          </label>
          <label className="text-xs text-surface-400">
            Tekst
            <input
              className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
              placeholder="Szukaj w logach"
            />
          </label>
        </div>
      </div>

      <div className="panel-card p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-surface-400">
          <div className="h-10 w-10 rounded-full border-2 border-surface-700 border-dashed" />
          <p className="text-sm">Brak podłączonego źródła logów.</p>
          <p className="text-xs text-surface-500">Po konfiguracji API pojawią się tutaj wpisy.</p>
        </div>
      </div>
    </div>
  );
}
