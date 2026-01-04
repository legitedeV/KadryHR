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
      } catch (e) {
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
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Marketing</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Subskrybenci newslettera</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value as NewsletterStatus | ""))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-900/50"
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-brand-400 dark:focus:ring-brand-900/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Imię</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data zapisu</th>
              <th className="px-4 py-3">Potwierdzono</th>
              <th className="px-4 py-3">Wypisano</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Ładujemy subskrybentów...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Brak subskrybentów w wybranym filtrze.
                </td>
              </tr>
            ) : (
              filtered.map((subscriber) => (
                <tr key={subscriber.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-50">
                    {subscriber.email}
                  </td>
                  <td className="px-4 py-3">{subscriber.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {statusLabels[subscriber.status as NewsletterStatus] ?? subscriber.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(subscriber.subscribedAt).toLocaleString("pl-PL")}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {subscriber.confirmedAt ? new Date(subscriber.confirmedAt).toLocaleString("pl-PL") : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
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
