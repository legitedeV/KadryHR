import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 'shift-approval',
      title: 'Grafik - zatwierdzenie',
      detail: 'Zmiana z 18:00 na 16:00 dla Anny Kowalskiej czeka na akceptację.',
      type: 'grafik',
      read: false,
    },
    {
      id: 'vacation',
      title: 'Urlop',
      detail: 'Potwierdź urlop 12-16 maja dla Pawła Nowaka.',
      type: 'urlop',
      read: false,
    },
    {
      id: 'l4',
      title: 'L4',
      detail: 'Nowe zwolnienie lekarskie Janiny Malec (7 dni).',
      type: 'l4',
      read: true,
    },
  ]);
  const [newNotification, setNewNotification] = useState('');

  const upcomingShifts = useMemo(
    () => [
      {
        id: 'mon',
        label: 'Poniedziałek',
        time: '08:00 - 16:00',
        person: 'Anna Kowalska',
        location: 'Biuro Kraków',
      },
      {
        id: 'tue',
        label: 'Wtorek',
        time: '09:00 - 17:00',
        person: 'Paweł Nowak',
        location: 'Biuro Warszawa',
      },
      {
        id: 'wed',
        label: 'Środa',
        time: '07:00 - 15:00',
        person: 'Janina Malec',
        location: 'Magazyn Łódź',
      },
    ],
    []
  );

  const timeOffItems = useMemo(
    () => [
      {
        id: 'vac',
        employee: 'Paweł Nowak',
        range: '12 - 16 maja',
        status: 'Oczekuje',
        type: 'Urlop wypoczynkowy',
      },
      {
        id: 'sick',
        employee: 'Janina Malec',
        range: '7 dni',
        status: 'Zatwierdzony',
        type: 'L4',
      },
      {
        id: 'remote',
        employee: 'Anna Kowalska',
        range: 'Piątek 08:00 - 14:00',
        status: 'Zaplanowany',
        type: 'Praca zdalna',
      },
    ],
    []
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/employees/summary');
      return data;
    },
  });

  const statusBadge = (status) => {
    switch (status) {
      case 'Zatwierdzony':
        return 'bg-emerald-100 text-emerald-700';
      case 'Oczekuje':
        return 'bg-amber-100 text-amber-700';
      case 'Zaplanowany':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const addNotification = () => {
    if (!newNotification.trim()) return;
    setAlerts((prev) => [
      {
        id: `custom-${Date.now()}`,
        title: 'Nowe powiadomienie',
        detail: newNotification.trim(),
        type: 'manual',
        read: false,
      },
      ...prev,
    ]);
    setNewNotification('');
  };

  const toggleRead = (id) => {
    setAlerts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              read: !item.read,
            }
          : item
      )
    );
  };

  const quickActionTemplates = {
    schedule: {
      title: 'Aktualizacja grafiku',
      detail: 'Dodano nową zmianę w grafiku na kolejny tydzień.',
      type: 'grafik',
    },
    leave: {
      title: 'Nowy wniosek urlopowy',
      detail: 'Utworzono szkic wniosku urlopowego dla zespołu.',
      type: 'urlop',
    },
    notify: {
      title: 'Powiadomienie e-mail',
      detail: 'Wysłano komunikat do pracowników o nadchodzącym zebraniu.',
      type: 'powiadomienie',
    },
  };

  const handleQuickAction = (key) => {
    const template = quickActionTemplates[key];
    if (!template) return;
    setAlerts((prev) => [
      {
        id: `${key}-${Date.now()}`,
        read: false,
        ...template,
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
        <p className="text-xs text-slate-500">
          Podsumowanie kadrowo-płacowe oraz statystyki czasu pracy.
        </p>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Ładowanie...</p>}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Nie udało się załadować danych dashboardu
        </p>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Pracownicy ogółem"
            value={data.totalEmployees}
            hint="Łączna liczba pracowników"
          />
          <StatCard
            label="Aktywni pracownicy"
            value={data.activeEmployees}
            hint="Obecnie zatrudnieni"
          />
          <StatCard
            label="Miesięczne wynagrodzenia (PLN)"
            value={data.totalPayrollAmount.toLocaleString('pl-PL')}
            hint="Szacowana suma brutto"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="app-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Najbliższe zmiany</h2>
              <p className="text-[11px] text-slate-500">Grafik pracy na kolejne dni.</p>
            </div>
            <span className="text-[11px] font-medium text-indigo-600">Grafik</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upcomingShifts.map((shift) => (
              <div
                key={shift.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3"
              >
                <div className="text-[11px] font-semibold text-indigo-700">{shift.label}</div>
                <div className="text-sm font-semibold text-slate-900">{shift.time}</div>
                <div className="text-[11px] text-slate-600">{shift.person}</div>
                <div className="text-[11px] text-slate-500 mt-1">{shift.location}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Urlopy i L4</h2>
              <p className="text-[11px] text-slate-500">Ostatnie zgłoszenia i statusy.</p>
            </div>
            <span className="text-[11px] font-medium text-emerald-600">Czas wolny</span>
          </div>

          <div className="space-y-3">
            {timeOffItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.employee}</div>
                    <div className="text-[11px] text-slate-500">{item.type}</div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${statusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">{item.range}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="app-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Powiadomienia wewnętrzne</h2>
            <span className="text-[11px] font-medium text-indigo-600">
              {alerts.filter((a) => !a.read).length} do przeczytania
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={newNotification}
              onChange={(e) => setNewNotification(e.target.value)}
              placeholder="Dodaj krótką notatkę / komunikat"
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addNotification}
              className="inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Dodaj
            </button>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{alert.title}</div>
                  <div className="text-[11px] text-slate-600">{alert.detail}</div>
                  <div className="text-[10px] uppercase tracking-wide text-indigo-600 mt-1">{alert.type}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRead(alert.id)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border ${
                    alert.read
                      ? 'border-slate-200 text-slate-500 bg-slate-50'
                      : 'border-indigo-200 text-indigo-700 bg-indigo-50'
                  }`}
                >
                  {alert.read ? 'Przeczytane' : 'Oznacz jako przeczytane'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">Szybkie akcje</h2>
          <p className="text-[11px] text-slate-600">
            Dodawaj natychmiastowe wpisy do grafiku, urlopów i powiadomień.
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAction('schedule')}
              className="w-full rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Dodaj zmianę w grafiku
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('leave')}
              className="w-full rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Zarejestruj wniosek urlopowy
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('notify')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Wyślij komunikat do zespołu
            </button>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            Zapisane wpisy nie są jeszcze wysyłane do API — służą do szybkiego szkicowania
            zadań i synchronizacji z modułami grafików, urlopów oraz powiadomień.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
