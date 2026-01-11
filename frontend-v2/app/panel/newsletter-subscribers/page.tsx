"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchNewsletterSubscribers, NewsletterSubscriberSummary, NewsletterStatus } from "@/lib/api";
import { pushToast } from "@/lib/toast";

const statusLabels: Record<NewsletterStatus, string> = {
  PENDING_CONFIRMATION: "Oczekuje na potwierdzenie",
  ACTIVE: "Aktywny",
  UNSUBSCRIBED: "Wypisany",
};

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NewsletterStatus | "">("");
  const [emailFilter, setEmailFilter] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchNewsletterSubscribers({
          status: statusFilter || undefined,
          email: emailFilter || undefined,
        });
        setSubscribers(data);
  } catch {
        pushToast({ title: "Błąd", description: "Nie udało się wczytać subskrybentów." });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter, emailFilter]);

  const filtered = useMemo(() => subscribers, [subscribers]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">Marketing</p>
          <h1 className="text-base font-bold text-surface-900 dark:text-surface-50 mt-1">Subskrybenci newslettera</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value as NewsletterStatus | ""))}
            className="input text-sm"
          >
            <option value="">Wszyscy</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Filtruj po e-mailu"
            className="input text-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="panel-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Imię</th>
              <th>Status</th>
              <th>Data zapisu</th>
              <th>Potwierdzono</th>
              <th>Wypisano</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-surface-500">
                  Ładujemy subskrybentów...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-surface-500">
                  Brak subskrybentów w wybranym filtrze.
                </td>
              </tr>
            ) : (
              filtered.map((subscriber) => (
                <tr key={subscriber.id} className="border-t border-surface-100 dark:border-surface-800">
                  <td className="font-semibold text-surface-900 dark:text-surface-50">
                    {subscriber.email}
                  </td>
                  <td>{subscriber.name ?? "-"}</td>
                  <td>
                    <span className="badge badge-neutral">
                      {statusLabels[subscriber.status as NewsletterStatus] ?? subscriber.status}
                    </span>
                  </td>
                  <td className="text-surface-600 dark:text-surface-300">
                    {new Date(subscriber.subscribedAt).toLocaleString("pl-PL")}
                  </td>
                  <td className="text-surface-600 dark:text-surface-300">
                    {subscriber.confirmedAt ? new Date(subscriber.confirmedAt).toLocaleString("pl-PL") : "-"}
                  </td>
                  <td className="text-surface-600 dark:text-surface-300">
                    {subscriber.unsubscribedAt ? new Date(subscriber.unsubscribedAt).toLocaleString("pl-PL") : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
