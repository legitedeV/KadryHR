"use client";

import { useEffect, useMemo, useState } from "react";
import {
  apiDownloadReportExport,
  apiGetAbsencesReport,
  apiGetOrganisationLocations,
  apiGetOrganisationMembers,
  apiGetReportExportHistory,
  apiGetWorkTimeReport,
  ReportExportHistoryItem,
  ReportType,
} from "@/lib/api";
import { pushToast } from "@/lib/toast";

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  .toISOString()
  .slice(0, 10);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  .toISOString()
  .slice(0, 10);

export default function ReportsPage() {
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [locationId, setLocationId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [leaveStatus, setLeaveStatus] = useState("");
  const [activeReport, setActiveReport] = useState<ReportType>("work-time");
  const [rowsCount, setRowsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [history, setHistory] = useState<ReportExportHistoryItem[]>([]);
  const [members, setMembers] = useState<
    Array<{
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email: string;
    }>
  >([]);
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const reportLabel =
    activeReport === "work-time" ? "Czas pracy" : "Nieobecności";

  useEffect(() => {
    void (async () => {
      try {
        const [membersResponse, locationsResponse] = await Promise.all([
          apiGetOrganisationMembers(),
          apiGetOrganisationLocations(),
        ]);
        setMembers(membersResponse.filter((item) => item.status === "ACTIVE"));
        setLocations(
          locationsResponse.map((item) => ({ id: item.id, name: item.name })),
        );
      } catch {
        pushToast({
          title: "Błąd",
          description: "Nie udało się załadować filtrów raportów.",
          variant: "error",
        });
      }
    })();

    void refreshHistory();
  }, []);

  const refreshHistory = async () => {
    try {
      const items = await apiGetReportExportHistory();
      setHistory(items);
    } catch {
      pushToast({
        title: "Błąd",
        description: "Nie udało się pobrać historii eksportów.",
        variant: "error",
      });
    }
  };

  const runReport = async () => {
    setLoading(true);
    try {
      if (activeReport === "work-time") {
        const response = await apiGetWorkTimeReport({
          from,
          to,
          locationId: locationId || undefined,
          employeeId: employeeId || undefined,
        });
        setRowsCount(response.total);
      } else {
        const response = await apiGetAbsencesReport({
          from,
          to,
          status: leaveStatus || undefined,
          employeeId: employeeId || undefined,
        });
        setRowsCount(response.total);
      }
    } catch {
      pushToast({
        title: "Błąd",
        description: "Nie udało się uruchomić raportu.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const download = async (format: "csv" | "xlsx") => {
    setDownloading(true);
    try {
      const result = await apiDownloadReportExport({
        reportType: activeReport,
        format,
        from,
        to,
        locationId: locationId || undefined,
        employeeId: employeeId || undefined,
        status: leaveStatus || undefined,
      });

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      pushToast({
        title: "Eksport gotowy",
        description: `Pobrano raport ${reportLabel} (${format.toUpperCase()})`,
        variant: "success",
      });
      await refreshHistory();
    } catch {
      pushToast({
        title: "Błąd",
        description: "Eksport nie powiódł się.",
        variant: "error",
      });
    } finally {
      setDownloading(false);
    }
  };

  const selectedEmployeeLabel = useMemo(() => {
    const employee = members.find((item) => item.id === employeeId);
    if (!employee) return "Wszyscy pracownicy";
    return (
      `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
      employee.email
    );
  }, [employeeId, members]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--text-main)]">
          Raporty
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Eksport danych czasu pracy (RCP) i nieobecności (urlopy).
        </p>
      </header>
      <section className="rounded-xl border border-[var(--border-soft)] bg-white p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            className={`rounded-md px-3 py-2 text-sm ${activeReport === "work-time" ? "bg-[var(--accent-soft)] text-[var(--text-main)]" : "border border-[var(--border-soft)]"}`}
            onClick={() => setActiveReport("work-time")}
          >
            Czas pracy
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm ${activeReport === "absences" ? "bg-[var(--accent-soft)] text-[var(--text-main)]" : "border border-[var(--border-soft)]"}`}
            onClick={() => setActiveReport("absences")}
          >
            Nieobecności
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            Od
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-soft)] px-2 py-1"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Do
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-soft)] px-2 py-1"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Lokalizacja
            <select
              className="mt-1 w-full rounded-md border border-[var(--border-soft)] px-2 py-1"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">Wszystkie</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Pracownik
            <select
              className="mt-1 w-full rounded-md border border-[var(--border-soft)] px-2 py-1"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Wszyscy</option>
              {members.map((item) => (
                <option key={item.id} value={item.id}>
                  {`${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() ||
                    item.email}
                </option>
              ))}
            </select>
          </label>
          {activeReport === "absences" ? (
            <label className="text-sm">
              Status
              <select
                className="mt-1 w-full rounded-md border border-[var(--border-soft)] px-2 py-1"
                value={leaveStatus}
                onChange={(e) => setLeaveStatus(e.target.value)}
              >
                <option value="">Wszystkie</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm"
            onClick={() => void runReport()}
            disabled={loading}
          >
            {loading ? "Liczenie…" : "Uruchom raport"}
          </button>
          <button
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
            onClick={() => void download("csv")}
            disabled={downloading}
          >
            Eksport CSV
          </button>
          <button
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
            onClick={() => void download("xlsx")}
            disabled={downloading}
          >
            Eksport XLSX
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Wynik: {rowsCount} rekordów • {selectedEmployeeLabel}
          </span>
        </div>
      </section>
      <section className="rounded-xl border border-[var(--border-soft)] bg-white p-4">
        <h2 className="text-lg font-medium">
          Centrum pobrań (ostatnie eksporty)
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-[var(--text-muted)]">
                <th className="py-2">Raport</th>
                <th className="py-2">Format</th>
                <th className="py-2">Rekordy</th>
                <th className="py-2">Autor</th>
                <th className="py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--border-soft)]"
                >
                  <td className="py-2">
                    {item.reportType === "work-time"
                      ? "Czas pracy"
                      : "Nieobecności"}
                  </td>
                  <td className="py-2 uppercase">{item.format}</td>
                  <td className="py-2">{item.rowCount}</td>
                  <td className="py-2">
                    {`${item.createdBy.firstName ?? ""} ${item.createdBy.lastName ?? ""}`.trim() ||
                      item.createdBy.email}
                  </td>
                  <td className="py-2">
                    {new Date(item.createdAt).toLocaleString("pl-PL")}
                  </td>
                </tr>
              ))}
              {history.length === 0 ? (
                <tr>
                  <td className="py-4 text-[var(--text-muted)]" colSpan={5}>
                    Brak eksportów.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
