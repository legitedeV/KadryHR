"use client";

import { useEffect, useMemo, useState } from "react";
import { KadryButton, KadryCard, Section } from "@kadryhr/ui";
import { api, Employee, Location, Shift } from "@/lib/api";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const formatTime = (date: Date) =>
  date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

export default function GrafikPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const [from, setFrom] = useState(() => formatDate(new Date()));
  const [to, setTo] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6);
    return formatDate(date);
  });
  const [formData, setFormData] = useState({
    employeeId: "",
    locationId: "",
    date: formatDate(new Date()),
    startTime: "08:00",
    endTime: "16:00",
  });
  const [message, setMessage] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = new Date(from);
    const end = new Date(to);
    const result: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [from, to]);

  const load = async () => {
    const [locationsData, employeesData, shiftsData] = await Promise.all([
      api.getLocations(),
      api.getEmployees(),
      api.getShifts({ from: new Date(from).toISOString(), to: new Date(to).toISOString(), locationId }),
    ]);
    setLocations(locationsData);
    setEmployees(employeesData);
    setShifts(shiftsData);
  };

  useEffect(() => {
    void load();
  }, [from, to, locationId]);

  useEffect(() => {
    if (!locationId && locations.length > 0) {
      setLocationId(locations[0].id);
      setFormData((prev) => ({ ...prev, locationId: locations[0].id }));
    }
  }, [locations, locationId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const start = new Date(`${formData.date}T${formData.startTime}:00`);
    const end = new Date(`${formData.date}T${formData.endTime}:00`);

    await api.createShift({
      employeeId: formData.employeeId,
      locationId: formData.locationId,
      start: start.toISOString(),
      end: end.toISOString(),
      published: true,
    });

    setMessage("Zmiana została dodana.");
    await load();
  };

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-emerald-950">Grafik pracy</h1>
          <p className="mt-2 text-emerald-700">Zarządzaj zmianami w wybranym zakresie.</p>
        </div>

        <KadryCard className="p-5">
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-emerald-900">
              Lokalizacja
              <select
                value={locationId}
                onChange={(event) => {
                  setLocationId(event.target.value);
                  setFormData((prev) => ({ ...prev, locationId: event.target.value }));
                }}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
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
          </form>
        </KadryCard>

        <KadryCard className="p-5">
          <form className="grid gap-4 md:grid-cols-5" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-emerald-900">
              Pracownik
              <select
                value={formData.employeeId}
                onChange={(event) => setFormData((prev) => ({ ...prev, employeeId: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                required
              >
                <option value="">Wybierz</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-emerald-900">
              Data
              <input
                type="date"
                value={formData.date}
                onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm font-medium text-emerald-900">
              Start
              <input
                type="time"
                value={formData.startTime}
                onChange={(event) => setFormData((prev) => ({ ...prev, startTime: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm font-medium text-emerald-900">
              Koniec
              <input
                type="time"
                value={formData.endTime}
                onChange={(event) => setFormData((prev) => ({ ...prev, endTime: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2"
                required
              />
            </label>
            <div className="flex items-end">
              <KadryButton type="submit" className="w-full">
                Dodaj zmianę
              </KadryButton>
            </div>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
        </KadryCard>

        <KadryCard className="overflow-x-auto p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-emerald-700">
                <th className="py-2 pr-4">Pracownik</th>
                {days.map((day) => (
                  <th key={day.toISOString()} className="py-2 pr-4">
                    {day.toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "2-digit" })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-emerald-100">
                  <td className="py-3 pr-4 font-medium text-emerald-950">
                    {employee.firstName} {employee.lastName}
                  </td>
                  {days.map((day) => {
                    const dateKey = formatDate(day);
                    const employeeShifts = shifts.filter((shift) => {
                      if (shift.employeeId !== employee.id) return false;
                      const shiftDate = formatDate(new Date(shift.start));
                      return shiftDate === dateKey;
                    });

                    return (
                      <td key={`${employee.id}-${dateKey}`} className="py-3 pr-4 text-emerald-800">
                        {employeeShifts.length === 0
                          ? "-"
                          : employeeShifts.map((shift) => {
                              const start = new Date(shift.start);
                              const end = new Date(shift.end);
                              return (
                                <div key={shift.id}>
                                  {formatTime(start)}–{formatTime(end)}
                                </div>
                              );
                            })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </KadryCard>
      </div>
    </Section>
  );
}
