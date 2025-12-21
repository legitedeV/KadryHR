import React, { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const formatDateLabel = (date) => {
  return new Date(date).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });
};

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${startDate.toLocaleDateString('pl-PL')} - ${endDate.toLocaleDateString('pl-PL')}`;
};

const statusBadge = (status) => {
  switch (status) {
    case 'approved':
    case 'Zatwierdzony':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
    case 'Oczekuje':
      return 'bg-amber-100 text-amber-700';
    case 'rejected':
      return 'bg-rose-100 text-rose-700';
    case 'Zaplanowany':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const Dashboard = () => {
  const queryClient = useQueryClient();

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/employees/summary');
      return data;
    },
  });

  const {
    data: scheduleEntries = [],
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useQuery({
    queryKey: ['schedule', 'upcoming'],
    queryFn: async () => {
      const now = new Date();
      const to = new Date(now);
      to.setDate(now.getDate() + 7);

      const { data } = await api.get('/schedule', {
        params: {
          from: now.toISOString(),
          to: to.toISOString(),
        },
      });

      return data;
    },
  });

  const {
    data: leaves = [],
    isLoading: leavesLoading,
    error: leavesError,
  } = useQuery({
    queryKey: ['leaves', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/leaves', { params: { status: 'pending' } });
      return data;
    },
  });

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
  });

  const markNotificationAsRead = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['notifications'], (current = []) =>
        current.map((item) => (item._id === updated._id ? updated : item))
      );
    },
  });

  const upcomingShifts = useMemo(() => {
    return scheduleEntries
      .map((entry) => ({
        id: entry._id,
        label: formatDateLabel(entry.date),
        time: `${entry.startTime} - ${entry.endTime}`,
        person: entry.employee
          ? `${entry.employee.firstName} ${entry.employee.lastName}`
          : 'Pracownik',
        location: entry.notes || 'Zmiana standardowa',
        sortKey: `${entry.date}T${entry.startTime}`,
      }))
      .sort((a, b) => (a.sortKey > b.sortKey ? 1 : -1))
      .slice(0, 3);
  }, [scheduleEntries]);

  const timeOffItems = useMemo(() => {
    return leaves
      .slice(0, 3)
      .map((leave) => ({
        id: leave._id,
        employee: leave.employee
          ? `${leave.employee.firstName} ${leave.employee.lastName}`
          : 'Pracownik',
        range: formatDateRange(leave.startDate, leave.endDate),
        status:
          leave.status === 'pending'
            ? 'Oczekuje'
            : leave.status === 'approved'
            ? 'Zatwierdzony'
            : 'Odrzucony',
        type: leave.type || 'Urlop',
      }));
  }, [leaves]);

  const alerts = useMemo(() => {
    return notifications.map((item) => ({
      id: item._id,
      title: item.title,
      detail: item.message,
      type: item.type,
      read: item.read,
    }));
  }, [notifications]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const invalidateAll = () => {
    queryClient.invalidateQueries(['dashboard-summary']);
    queryClient.invalidateQueries(['schedule', 'upcoming']);
    queryClient.invalidateQueries(['leaves', 'recent']);
    queryClient.invalidateQueries(['notifications']);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
        <p className="text-xs text-slate-500">
          Podsumowanie kadrowo-płacowe oraz statystyki czasu pracy.
        </p>
      </div>

      {(summaryLoading || scheduleLoading || leavesLoading || notificationsLoading) && (
        <p className="text-xs text-slate-500">Ładowanie danych...</p>
      )}
      {(summaryError || scheduleError || leavesError || notificationsError) && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Nie udało się załadować części danych dashboardu. Sprawdź token i połączenie z API.
        </p>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Pracownicy ogółem"
            value={summary.totalEmployees}
            hint="Łączna liczba pracowników"
          />
          <StatCard
            label="Aktywni pracownicy"
            value={summary.activeEmployees}
            hint="Obecnie zatrudnieni"
          />
          <StatCard
            label="Miesięczne wynagrodzenia (PLN)"
            value={(summary.totalPayrollAmount || 0).toLocaleString('pl-PL')}
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

          {upcomingShifts.length === 0 && (
            <p className="text-[11px] text-slate-500">Brak zaplanowanych zmian w nadchodzącym tygodniu.</p>
          )}

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

          {timeOffItems.length === 0 && (
            <p className="text-[11px] text-slate-500">Brak oczekujących wniosków urlopowych.</p>
          )}

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
              {unreadCount} do przeczytania
            </span>
          </div>

          {alerts.length === 0 && (
            <p className="text-[11px] text-slate-500">
              Brak nowych powiadomień. Wszystkie dane pochodzą bezpośrednio z API.
            </p>
          )}

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
                  onClick={() => markNotificationAsRead.mutate(alert.id)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border ${
                    alert.read
                      ? 'border-slate-200 text-slate-500 bg-slate-50 cursor-default'
                      : 'border-indigo-200 text-indigo-700 bg-indigo-50'
                  }`}
                  disabled={alert.read || markNotificationAsRead.isLoading}
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
            Wszystkie dane poniżej pochodzą z API (cookie + JWT). Użyj skrótów, aby odświeżyć
            widok po zmianach w innych modułach.
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries(['schedule'])}
              className="w-full rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Odśwież grafik
            </button>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries(['leaves'])}
              className="w-full rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Odśwież wnioski urlopowe
            </button>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries(['notifications'])}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Odśwież powiadomienia
            </button>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            Szybkie akcje korzystają z tego samego JWT (cookie lub Bearer). Jeśli wcześniej pojawiały
            się błędy tokenu, spróbuj ponownie po zalogowaniu – wszystkie endpointy używają teraz
            wspólnego middleware.
          </div>

          <button
            type="button"
            onClick={invalidateAll}
            className="w-full rounded-lg bg-slate-800 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-900"
          >
            Odśwież wszystkie kafelki
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
