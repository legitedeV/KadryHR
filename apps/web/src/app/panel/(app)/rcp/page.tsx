"use client";

import { useEffect, useState } from "react";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api, Employee, TimeEntry } from "@/lib/api";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });

export default function RcpPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheet, setTimesheet] = useState<{
    totalHours: number;
    totalEntries: number;
  } | null>(null);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const [entriesData, employeesData] = await Promise.all([
      api.getTimeEntries({ from: weekAgo.toISOString(), to: now.toISOString() }),
      api.getEmployees(),
    ]);
    setEntries(entriesData);
    setEmployees(employeesData);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleClockIn = async () => {
    setMessage(null);
    await api.clockIn();
    setMessage("Zalogowano wejście.");
    await load();
  };

  const handleClockOut = async () => {
    setMessage(null);
    await api.clockOut();
    setMessage("Zalogowano wyjście.");
    await load();
  };

  const handleTimesheet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await api.getTimesheet({
      from: from || undefined,
      to: to || undefined,
      employeeId: employeeId || undefined,
    });
    setTimesheet({ totalHours: response.totalHours, totalEntries: response.totalEntries });
  };

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Rejestracja czasu pracy</h1>
          <p className="mt-2 text-emerald-700">Zaloguj wejście i wyjście, a następnie sprawdź ewidencję.</p>
        </div>

        <KadryCard className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <KadryButton onClick={handleClockIn}>Zaloguj wejście</KadryButton>
          <KadryButton variant="secondary" onClick={handleClockOut}>
            Zaloguj wyjście
          </KadryButton>
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        </KadryCard>

        <KadryCard className="p-5">
          <h2 className="text-lg font-semibold text-emerald-950">Ostatnie wpisy</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-emerald-700">
                  <th className="py-2 pr-4">Pracownik</th>
                  <th className="py-2 pr-4">Wejście</th>
                  <th className="py-2 pr-4">Wyjście</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-emerald-100">
                    <td className="py-3 pr-4 text-emerald-950">
                      {entry.employee
                        ? `${entry.employee.firstName} ${entry.employee.lastName}`
                        : entry.employeeId}
                    </td>
                    <td className="py-3 pr-4 text-emerald-800">{formatDateTime(entry.clockIn)}</td>
                    <td className="py-3 pr-4 text-emerald-800">
                      {entry.clockOut ? formatDateTime(entry.clockOut) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </KadryCard>

        <KadryCard className="p-5">
          <h2 className="text-lg font-semibold text-emerald-950">Ewidencja godzin</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-4" onSubmit={handleTimesheet}>
            <label className="text-sm font-medium text-emerald-900">
              Pracownik
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
              >
                <option value="">Wszyscy</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-emerald-900">
              Od
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-emerald-900">
              Do
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
              />
            </label>
            <div className="flex items-end">
              <KadryButton type="submit" className="w-full">
                Pobierz raport
              </KadryButton>
            </div>
          </form>
          {timesheet ? (
            <div className="mt-4 text-sm text-emerald-700">
              <p>Łącznie godzin: {timesheet.totalHours.toFixed(2)}</p>
              <p>Liczba wpisów: {timesheet.totalEntries}</p>
            </div>
          ) : null}
        </KadryCard>
      </div>
    </Section>
  );
}
