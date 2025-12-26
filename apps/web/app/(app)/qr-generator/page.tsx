"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth, useToast } from "../../providers";
import { generateQr } from "../time-tracking/data-client";
import { Employee } from "../schedule-builder/data-client";

export default function QrGeneratorPage() {
  const { api } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ locationLabel: "", employeeId: "", note: "" });

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees", { query: { status: "active" } }),
  });

  useEffect(() => {
    const first = employeesQuery.data?.[0]?.id;
    if (!form.employeeId && first) {
      setForm((prev) => ({ ...prev, employeeId: first }));
    }
  }, [employeesQuery.data, form.employeeId]);

  const mutation = useMutation({
    mutationFn: () => generateQr(api, { ...form, employeeId: form.employeeId || undefined }),
    onSuccess: () => pushToast("Wygenerowano kod QR", "success"),
    onError: (error) => pushToast((error as Error).message || "Nie udało się wygenerować kodu", "error"),
  });

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            /qr-generator
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Generator kodów QR
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Twórz kody przypisane do lokalizacji lub pracowników i drukuj je od razu.
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--surface-secondary)", color: "var(--text-tertiary)" }}>
          Parity ready
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border p-5" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Dane do kodu
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Dodaj nazwę punktu, opcjonalnie przypisz pracownika i notatkę.
              </div>
            </div>
            {mutation.isSuccess && (
              <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}>
                Gotowe
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Lokalizacja
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={form.locationLabel}
                onChange={(e) => setForm((p) => ({ ...p, locationLabel: e.target.value }))}
                placeholder="np. Magazyn Wrocław"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Pracownik (opcjonalnie)
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                value={form.employeeId}
                onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
              >
                <option value="">Dowolny pracownik</option>
                {employeesQuery.data?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Notatka / instrukcja
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                rows={3}
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="np. Przyłóż kod przy wejściu i wyjściu"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                background: "var(--theme-primary)",
                color: "white",
                opacity: !form.locationLabel || mutation.isPending ? 0.7 : 1,
              }}
              disabled={!form.locationLabel || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Generuję..." : "Generuj kod"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Podgląd QR
          </div>
          {result?.qrDataUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <img src={result.qrDataUrl} alt="Kod QR" className="border rounded-lg" style={{ borderColor: "var(--border-primary)" }} />
              </div>
              <div className="rounded-lg border p-3 text-xs space-y-2" style={{ borderColor: "var(--border-primary)", color: "var(--text-tertiary)" }}>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    Token
                  </div>
                  <code className="break-all text-[11px] block">{result.token}</code>
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    Payload
                  </div>
                  <code className="break-all text-[11px] block">{JSON.stringify(result.payload)}</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Uzupełnij dane i wygeneruj kod, aby zobaczyć podgląd.
            </div>
          )}
          <div className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border-primary)", color: "var(--text-tertiary)" }}>
            Zeskanowanie kodu zaszywa kontekst organizacji i (opcjonalnie) pracownika, dzięki czemu wpis trafia do właściwej listy zdarzeń.
          </div>
        </div>
      </div>
    </div>
  );
}
