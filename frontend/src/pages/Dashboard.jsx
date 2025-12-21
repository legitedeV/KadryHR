import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const dayFormatter = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'long',
});

const fullDateFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const statusBadge = (statusKey) => {
  switch (statusKey) {
    case 'approved':
    case 'Zatwierdzony':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
    case 'Oczekuje':
      return 'bg-amber-100 text-amber-700';
    case 'rejected':
    case 'Odrzucony':
      return 'bg-red-100 text-red-700';
    case 'Zaplanowany':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'approved':
      return 'Zatwierdzony';
    case 'pending':
      return 'Oczekuje';
    case 'rejected':
      return 'Odrzucony';
    default:
      return status || 'Brak statusu';
  }
};

const leaveTypeLabel = (type) => {
  switch (type) {
    case 'annual':
      return 'Urlop wypoczynkowy';
    case 'on_demand':
      return 'Urlop na żądanie';
    case 'unpaid':
      return 'Urlop bezpłatny';
    case 'occasional':
      return 'Urlop okolicznościowy';
    default:
      return 'Urlop';
  }
};

const Dashboard = () => {
  const [newNotification, setNewNotification] = useState('');
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

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', 'upcoming'],
    queryFn: async () => {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 7);

      const { data } = await api.get('/schedule', {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      });

      return data;
    },
  });

  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/leaves', {
        params: { status: 'pending' },
      });
      return data;
    },
  });

  const { data: sickLeavesData, isLoading: sickLoading } = useQuery({
    queryKey: ['sick-leaves', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/sick-leaves');
      return data;
    },
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: (payload) => api.post('/notifications', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setNewNotification('');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const addNotification = () => {
    if (!newNotification.trim()) return;
    createNotificationMutation.mutate({
      title: 'Nowe powiadomienie',
      message: newNotification.trim(),
      type: 'general',
    });
  };

  const quickActionTemplates = {
    schedule: {
      title: 'Aktualizacja grafiku',
      message: 'Dodano nową zmianę w grafiku na kolejny tydzień.',
      type: 'schedule',
    },
    leave: {
      title: 'Nowy wniosek urlopowy',
      message: 'Utworzono szkic wniosku urlopowego dla zespołu.',
      type: 'leave',
    },
    notify: {
      title: 'Komunikat e-mail',
      message: 'Wysłano komunikat do pracowników o nadchodzącym zebraniu.',
      type: 'general',
    },
  };

  const handleQuickAction = (key) => {
    const template = quickActionTemplates[key];
    if (!template) return;
    createNotificationMutation.mutate(template);
  };

  const upcomingShifts = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return [];

    return scheduleData
      .map((entry) => {
        const date = new Date(entry.date);
        return {
          id: entry._id,
          label: dayFormatter.format(date),
          time: `${entry.startTime} - ${entry.endTime}`,
          person: entry.employee
            ? `${entry.employee.firstName} ${entry.employee.lastName}`
            : 'Pracownik',
          location: entry.employee?.position || 'Zmiana',
          sortKey: date.getTime(),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, 3);
  }, [scheduleData]);

  const timeOffItems = useMemo(() => {
    const leaveItems = (leavesData || []).map((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return {
        id: leave._id,
        employee: leave.employee
          ? `${leave.employee.firstName} ${leave.employee.lastName}`
          : 'Pracownik',
        range: `${fullDateFormatter.format(start)} - ${fullDateFormatter.format(
          end
        )}`,
        status: leave.status,
        type: leaveTypeLabel(leave.type),
        sortKey: start.getTime(),
      };
    });

    const sickItems = (sickLeavesData || []).map((item) => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      return {
        id: item._id,
        employee: item.employee
          ? `${item.employee.firstName} ${item.employee.lastName}`
          : 'Pracownik',
        range: `${fullDateFormatter.format(start)} - ${fullDateFormatter.format(
          end
        )}`,
        status: 'approved',
        type: 'Zwolnienie lekarskie',
        sortKey: start.getTime(),
      };
    });

    return [...leaveItems, ...sickItems]
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, 5);
  }, [leavesData, sickLeavesData]);

  const alerts = useMemo(() => notificationsData || [], [notificationsData]);
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryLoading && (
          <div className="col-span-3 text-sm text-slate-500">Ładowanie podsumowania...</div>
        )}
        {summaryError && (
          <div className="col-span-3 text-sm text-red-600">Nie udało się pobrać podsumowania.</div>
        )}

        {summary && (
          <>
            <StatCard
              label="Pracownicy (łącznie)"
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
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="app-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Najbliższe zmiany</h2>
              <p className="text-[11px] text-slate-500">Grafik pracy na kolejne dni.</p>
            </div>
            <span className="text-[11px] font-medium text-indigo-600">Grafik</span>
          </div>

          {(scheduleLoading || upcomingShifts.length === 0) && (
            <div className="text-[11px] text-slate-500">
              {scheduleLoading ? 'Ładowanie grafiku...' : 'Brak zaplanowanych zmian.'}
            </div>
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

          <div className="space-y-3">
            {(leavesLoading || sickLoading) && (
              <div className="text-[11px] text-slate-500">Ładowanie wniosków...</div>
            )}
            {timeOffItems.length === 0 && !leavesLoading && !sickLoading && (
              <div className="text-[11px] text-slate-500">Brak wniosków urlopowych ani L4.</div>
            )}
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
                    {getStatusLabel(item.status)}
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
              {notificationsLoading ? 'Ładowanie...' : `${unreadCount} do przeczytania`}
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
              disabled={createNotificationMutation.isLoading}
              className="inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {createNotificationMutation.isLoading ? 'Zapisywanie...' : 'Dodaj'}
            </button>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className="flex items-start justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{alert.title}</div>
                  <div className="text-[11px] text-slate-600">{alert.message}</div>
                  <div className="text-[10px] uppercase tracking-wide text-indigo-600 mt-1">
                    {alert.type}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => markAsReadMutation.mutate(alert._id)}
                  disabled={markAsReadMutation.isLoading || alert.read}
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
            {alerts.length === 0 && !notificationsLoading && (
              <div className="text-[11px] text-slate-500">
                Brak powiadomień. Dodaj komunikat lub poczekaj na automatyczne wpisy.
              </div>
            )}
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
            Powiadomienia zapisują się w bazie i możesz je oznaczać jako przeczytane.
            Wpisy w grafiku, urlopach i L4 pobierane są bezpośrednio z API.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
