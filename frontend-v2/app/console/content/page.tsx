"use client";

import { useMemo, useState } from "react";

const placeholderKeys = [
  {
    key: "landing.hero.title",
    value: "Nowoczesne kadry i grafiki w jednym miejscu",
    tags: ["landing"],
  },
  {
    key: "panel.dashboard.welcome",
    value: "Witaj ponownie w KadryHR",
    tags: ["panel"],
  },
  {
    key: "email.invite.subject",
    value: "Zaproszenie do zespołu w KadryHR",
    tags: ["email"],
  },
];

const suspiciousTokens = ["TODO", "FIXME", "demo", "test", "lorem", "example", "sample"];

export default function ConsoleContentPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    if (!query.trim()) return placeholderKeys;
    const lowered = query.toLowerCase();
    return placeholderKeys.filter((item) =>
      [item.key, item.value, item.tags.join(" ")].some((field) =>
        field.toLowerCase().includes(lowered),
      ),
    );
  }, [query]);

  const suspiciousMatches = useMemo(
    () =>
      placeholderKeys.filter((item) =>
        suspiciousTokens.some((token) => item.value.toLowerCase().includes(token.toLowerCase())),
      ),
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Content & i18n</h1>
        <p className="text-sm text-surface-400 mt-1">
          Centralny przegląd kluczowych treści oraz tłumaczeń. Moduł docelowo będzie pobierać
          dane z backendu, aby umożliwić pełne zarządzanie copy.
        </p>
      </div>

      <div className="panel-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Kluczowe teksty (podgląd)</h2>
            <p className="text-xs text-surface-400 mt-1">
              Wyszukuj i weryfikuj fragmenty copy. Edycja zostanie udostępniona po podłączeniu
              magazynu tłumaczeń.
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj po kluczu, tekście lub tagach"
            className="w-full sm:w-72 rounded-xl border border-surface-800/70 bg-surface-950 px-3 py-2 text-sm text-surface-100"
          />
        </div>
        <div className="overflow-hidden rounded-2xl border border-surface-800/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-900/70 text-surface-400">
              <tr>
                <th className="px-4 py-3">Klucz</th>
                <th className="px-4 py-3">PL</th>
                <th className="px-4 py-3">Tagi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.key} className="border-t border-surface-800/60">
                  <td className="px-4 py-3 text-surface-100 font-medium">{item.key}</td>
                  <td className="px-4 py-3 text-surface-200">{item.value}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-surface-800/80 bg-surface-900/80 px-2 py-0.5 text-[11px] text-surface-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel-card p-6 space-y-3">
        <h2 className="text-lg font-semibold text-surface-100">Detekcja placeholderów</h2>
        <p className="text-sm text-surface-400">
          System flaguje słowa typu TODO/FIXME/demo/test/lorem. W docelowej wersji będzie to
          działać na pełnym zbiorze tłumaczeń.
        </p>
        {suspiciousMatches.length === 0 ? (
          <p className="text-sm text-emerald-300">Brak podejrzanych fraz w podglądzie.</p>
        ) : (
          <ul className="space-y-2 text-sm text-surface-200">
            {suspiciousMatches.map((item) => (
              <li key={item.key} className="rounded-xl border border-surface-800/60 bg-surface-900/60 px-3 py-2">
                <span className="font-semibold">{item.key}</span>: {item.value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
