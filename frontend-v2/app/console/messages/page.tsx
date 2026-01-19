"use client";

import { useState } from "react";

const sampleTemplates = [
  { id: "invite-team", name: "Zaproszenie do zespołu", type: "transactional", updatedAt: "2024-04-16" },
  { id: "trial-expiry", name: "Koniec okresu próbnego", type: "transactional", updatedAt: "2024-04-10" },
  { id: "newsletter", name: "Newsletter kwiecień", type: "marketing", updatedAt: "2024-04-01" },
];

export default function ConsoleMessagesPage() {
  const [activeTab, setActiveTab] = useState<"email" | "sms" | "test">("email");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Emails & SMS</h1>
        <p className="text-sm text-surface-400 mt-1">
          Zarządzaj szablonami wiadomości i testowymi wysyłkami. Moduł zostanie podłączony do
          backendu po stabilizacji szablonów.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "email", label: "Email Templates" },
            { key: "sms", label: "SMS Templates" },
            { key: "test", label: "Test Send" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-brand-700/60 text-brand-100"
                : "bg-surface-900/60 text-surface-400 hover:bg-surface-800/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "email" && (
        <div className="panel-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">Szablony e-mail</h2>
          <div className="space-y-3">
            {sampleTemplates.map((template) => (
              <div
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-surface-100">{template.name}</p>
                  <p className="text-xs text-surface-500">
                    {template.id} · {template.type} · {template.updatedAt}
                  </p>
                </div>
                <button className="btn-secondary px-3 py-1.5 text-xs" type="button">
                  Podgląd
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "sms" && (
        <div className="panel-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">Szablony SMS</h2>
          <p className="text-sm text-surface-400">
            Brak skonfigurowanych szablonów SMS. Po uruchomieniu backendu pojawią się w tym miejscu.
          </p>
        </div>
      )}

      {activeTab === "test" && (
        <div className="panel-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-100">Wyślij testowo</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-surface-300">
              E-mail odbiorcy
              <input
                className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                placeholder="test@kadryhr.pl"
              />
            </label>
            <label className="text-sm text-surface-300">
              Telefon odbiorcy
              <input
                className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100"
                placeholder="+48 600 000 000"
              />
            </label>
            <label className="text-sm text-surface-300 md:col-span-2">
              Uwagi
              <textarea
                className="mt-2 w-full rounded-xl border border-surface-800/70 bg-surface-900/60 px-3 py-2 text-surface-100 min-h-[100px]"
                placeholder="Notatka testowa..."
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-surface-400">
            <span>Wysyłki testowe są ograniczone do białej listy w środowisku PROD.</span>
            <button type="button" className="btn-primary px-4 py-2 text-sm">
              Wyślij test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
