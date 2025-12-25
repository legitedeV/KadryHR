import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const dayFormatter = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' });
const fullDateFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [newNotification, setNewNotification] = useState('');
  const [notificationError, setNotificationError] = useState(null);
  const [availabilityForm, setAvailabilityForm] = useState({
    startDate: '',
    endDate: '',
    daysOfWeek: [1, 2, 3, 4, 5],
    preferredStartTime: '08:00',
    preferredEndTime: '16:00',
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    type: 'available',
    notes: '',
  });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const {
    data: summary,
    error: summaryError,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/employees/summary');
      return data;
    },
    enabled: isAdmin,
  });

  const { data: currentEmployee } = useQuery({
    queryKey: ['current-employee'],
    queryFn: async () => {
      const { data } = await api.get('/employees/me');
      return data.employee || null;
    },
    enabled: !isAdmin,
  });

  const {
    data: scheduleData,
    isLoading: scheduleLoading,
  } = useQuery({
    queryKey: ['schedule', isAdmin ? 'all' : 'user', currentEmployee?._id],
    queryFn: async () => {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 30);

      const params = { from: from.toISOString(), to: to.toISOString() };
      if (!isAdmin && currentEmployee?._id) {
        params.employeeId = currentEmployee._id;
      }

      const { data } = await api.get('/schedule', { params });
      return data;
    },
    enabled: isAdmin || !!currentEmployee,
  });

  const { data: leavesData } = useQuery({
    queryKey: ['leaves', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/leaves', { params: isAdmin ? { status: 'pending' } : {} });
      return data;
    },
  });

  const { data: sickLeavesData } = useQuery({
    queryKey: ['sick-leaves', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/sick-leaves');
      return data;
    },
    enabled: isAdmin,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['availability', 'user', currentEmployee?._id],
    queryFn: async () => {
      if (!currentEmployee?._id) return [];
      const { data } = await api.get('/availability', { params: { employeeId: currentEmployee._id } });
      return data;
    },
    enabled: !isAdmin && !!currentEmployee,
  });

  const createNotificationMutation = useMutation({
    mutationFn: (payload) => api.post('/notifications', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setNewNotification('');
      setNotificationError(null);
    },
    onError: () => setNotificationError('Nie udało się zapisać powiadomienia.'),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => setNotificationError('Nie udało się oznaczyć powiadomienia jako przeczytane.'),
  });

  const submitAvailabilityMutation = useMutation({
    mutationFn: (payload) => api.post('/availability', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setAvailabilityForm({
        startDate: '',
        endDate: '',
        daysOfWeek: [1, 2, 3, 4, 5],
        preferredStartTime: '08:00',
        preferredEndTime: '16:00',
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        type: 'available',
        notes: '',
      });
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

  const toggleAvailabilityDay = (dayValue) => {
    setAvailabilityForm((prev) => {
      const exists = prev.daysOfWeek.includes(dayValue);
      return {
        ...prev,
        daysOfWeek: exists ? prev.daysOfWeek.filter((d) => d !== dayValue) : [...prev.daysOfWeek, dayValue],
      };
    });
  };

  const handleSubmitAvailability = () => {
    if (!availabilityForm.startDate || !availabilityForm.endDate || !currentEmployee?._id) return;
    submitAvailabilityMutation.mutate({ employeeId: currentEmployee._id, ...availabilityForm });
  };

  const nextShift = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return null;
    const now = new Date();
    const upcoming = scheduleData
      .filter((entry) => new Date(entry.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming[0] || null;
  }, [scheduleData]);

  useEffect(() => {
    if (!nextShift) return;
    const updateCountdown = () => {
      const now = new Date();
      const shiftDate = new Date(nextShift.date);
      const [hours, minutes] = nextShift.startTime.split(':').map(Number);
      shiftDate.setHours(hours, minutes, 0, 0);
      const diff = shiftDate - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours: hrs, minutes: mins, seconds: secs });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextShift]);

  const upcomingShifts = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return [];
    return scheduleData
      .map((entry) => {
        const date = new Date(entry.date);
        return {
          id: entry._id,
          label: dayFormatter.format(date),
          date: fullDateFormatter.format(date),
          time: `${entry.startTime} - ${entry.endTime}`,
          person: entry.employee ? `${entry.employee.firstName} ${entry.employee.lastName}` : 'Pracownik',
          location: entry.employee?.position || 'Zmiana',
          sortKey: date.getTime(),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, 5);
  }, [scheduleData]);

  const timeOffItems = useMemo(() => {
    const leaveItems = (leavesData || []).map((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return {
        id: leave._id,
        employee: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Pracownik',
        range: `${fullDateFormatter.format(start)} - ${fullDateFormatter.format(end)}`,
        status: leave.status,
        type: leave.type || 'Urlop',
        sortKey: start.getTime(),
      };
    });

    const sickItems = (sickLeavesData || []).map((item) => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      return {
        id: item._id,
        employee: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Pracownik',
        range: `${fullDateFormatter.format(start)} - ${fullDateFormatter.format(end)}`,
        status: item.status || 'approved',
        type: 'Zwolnienie lekarskie',
        sortKey: start.getTime(),
      };
    });

    return [...leaveItems, ...sickItems].sort((a, b) => a.sortKey - b.sortKey).slice(0, 6);
  }, [leavesData, sickLeavesData]);

  const alerts = useMemo(() => notificationsData || [], [notificationsData]);
  const unreadCount = alerts.filter((a) => !a.read).length;

  const metrics = useMemo(() => {
    const pendingLeaves = (leavesData || []).filter((l) => l.status === 'pending').length;
    const pendingSick = (sickLeavesData || []).filter((l) => l.status === 'pending').length;

    return [
      {
        label: 'Aktywni pracownicy',
        value: summary?.activeEmployees ?? '—',
        route: '/employees',
      },
      {
        label: 'Oczekujące wnioski',
        value: pendingLeaves + pendingSick,
        route: '/leaves',
      },
      {
        label: 'Zaplanowane zmiany',
        value: scheduleData?.length || 0,
        route: '/schedule-builder',
      },
      {
        label: 'Spóźnienia',
        value: 0,
        route: '/time-tracking',
      },
    ];
  }, [leavesData, sickLeavesData, scheduleData, summary]);

  const quickLinks = [
    {
      title: 'Grafiki i dyżury',
      description: 'Plan miesięczny, blokady kolizji i widok zespołu.',
      action: () => navigate('/schedule-builder'),
    },
    {
      title: 'Urlopy i L4',
      description: 'Wnioski online i szybkie decyzje.',
      action: () => navigate('/leaves'),
    },
    {
      title: 'Czas pracy',
      description: 'Wejścia/wyjścia, raporty i eksport.',
      action: () => navigate('/time-tracking'),
    },
    {
      title: 'Powiadomienia',
      description: 'Komunikaty e-mail i w aplikacji.',
      action: () => navigate('/notifications'),
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white shadow-xl"
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.5),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.35),transparent_35%)]" />
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur">
              {isAdmin ? 'Panel administratora' : 'Mój pulpit'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-snug">Twoje centrum dowodzenia HR</h1>
            <p className="text-sm text-blue-100 max-w-2xl">
              Dopasowaliśmy dashboard do stylistyki landing page. Wszystkie kafelki prowadzą do kluczowych modułów, a dane są podane w przejrzystych kartach.
            </p>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((item) => (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
                >
                  {item.title}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {nextShift && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 min-w-[260px]">
              <div className="text-xs uppercase tracking-[0.2em] text-blue-100">Następna zmiana</div>
              <div className="text-xl font-semibold mt-1">{fullDateFormatter.format(new Date(nextShift.date))}</div>
              <div className="text-sm text-blue-100">{nextShift.startTime} - {nextShift.endTime}</div>
              <div className="flex gap-3 mt-3 text-center">
                {[{ label: 'Dni', value: countdown.days }, { label: 'Godz', value: countdown.hours }, { label: 'Min', value: countdown.minutes }].map((item) => (
                  <div key={item.label} className="flex-1">
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-[11px] uppercase tracking-wide text-blue-100">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            onClick={() => navigate(metric.route)}
            className="group rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/70 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.5)] p-4 text-left hover:-translate-y-0.5 transition"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
              <span className="text-[11px] text-sky-600 dark:text-sky-300 opacity-0 group-hover:opacity-100 transition">Przejdź →</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/70 p-5 shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Grafik</p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Nadchodzące zmiany</h2>
              </div>
              <button
                onClick={() => navigate('/schedule-builder')}
                className="text-sm font-semibold text-sky-600 dark:text-sky-300"
              >
                Otwórz grafik →
              </button>
            </div>
            {scheduleLoading ? (
              <p className="text-sm text-slate-500">Ładowanie grafiku...</p>
            ) : upcomingShifts.length === 0 ? (
              <p className="text-sm text-slate-500">Brak zaplanowanych zmian w najbliższym czasie.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcomingShifts.map((shift) => (
                  <div key={shift.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{shift.label} · {shift.date}</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{shift.time}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{shift.person}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{shift.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/70 p-5 shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Wnioski</p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Urlopy i L4</h2>
              </div>
              <button onClick={() => navigate('/leaves')} className="text-sm font-semibold text-sky-600 dark:text-sky-300">
                Przejdź do listy →
              </button>
            </div>
            {timeOffItems.length === 0 ? (
              <p className="text-sm text-slate-500">Brak zgłoszonych urlopów.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {timeOffItems.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.employee}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.range}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.type}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border ${item.status === 'approved' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : item.status === 'pending' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                      {item.status === 'pending' ? 'Oczekuje' : item.status === 'rejected' ? 'Odrzucony' : 'Zatwierdzony'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/70 p-5 shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Powiadomienia</p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Kanał komunikatów</h2>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {unreadCount} nieprzeczytane
              </span>
            </div>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-500">Brak powiadomień.</p>
              ) : (
                alerts.slice(0, 6).map((alert) => (
                  <div key={alert._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{alert.message}</p>
                    </div>
                    {!alert.read && (
                      <button
                        onClick={() => markAsReadMutation.mutate(alert._id)}
                        className="text-[11px] text-sky-600 dark:text-sky-300"
                      >
                        Oznacz
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs text-slate-500 dark:text-slate-400">Dodaj krótką notatkę</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNotification}
                  onChange={(e) => setNewNotification(e.target.value)}
                  placeholder="Napisz wiadomość dla zespołu"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
                <button
                  onClick={addNotification}
                  disabled={createNotificationMutation.isLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow"
                >
                  Wyślij
                </button>
              </div>
              {notificationError && <p className="text-xs text-red-600">{notificationError}</p>}
            </div>
          </div>

          {!isAdmin && (
            <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/70 p-5 shadow space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Dostępność</p>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Zgłoś preferencje</h2>
                </div>
                <button onClick={() => navigate('/profile')} className="text-xs font-semibold text-sky-600 dark:text-sky-300">Profil →</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">Od</label>
                  <input
                    type="date"
                    value={availabilityForm.startDate}
                    onChange={(e) => setAvailabilityForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">Do</label>
                  <input
                    type="date"
                    value={availabilityForm.endDate}
                    onChange={(e) => setAvailabilityForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ value: 1, label: 'Pon' }, { value: 2, label: 'Wt' }, { value: 3, label: 'Śr' }, { value: 4, label: 'Czw' }, { value: 5, label: 'Pt' }, { value: 6, label: 'Sob' }, { value: 0, label: 'Niedz' }].map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleAvailabilityDay(day.value)}
                    className={`px-3 py-1 rounded-full border text-xs ${availabilityForm.daysOfWeek.includes(day.value)
                      ? 'border-sky-500 text-sky-600 bg-sky-50'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">Start</label>
                  <input
                    type="time"
                    value={availabilityForm.preferredStartTime}
                    onChange={(e) => setAvailabilityForm((p) => ({ ...p, preferredStartTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">Koniec</label>
                  <input
                    type="time"
                    value={availabilityForm.preferredEndTime}
                    onChange={(e) => setAvailabilityForm((p) => ({ ...p, preferredEndTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">Max godz./dzień</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={availabilityForm.maxHoursPerDay}
                    onChange={(e) => setAvailabilityForm((p) => ({ ...p, maxHoursPerDay: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">Max godz./tydzień</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={availabilityForm.maxHoursPerWeek}
                    onChange={(e) => setAvailabilityForm((p) => ({ ...p, maxHoursPerWeek: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400">Notatki</label>
                <input
                  type="text"
                  value={availabilityForm.notes}
                  onChange={(e) => setAvailabilityForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                  placeholder="np. preferencje dotyczące lokalizacji"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitAvailability}
                  disabled={submitAvailabilityMutation.isLoading || !availabilityForm.startDate || !availabilityForm.endDate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow disabled:opacity-60"
                >
                  {submitAvailabilityMutation.isLoading ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                </button>
              </div>
              {submitAvailabilityMutation.isSuccess && (
                <p className="text-xs text-emerald-600">Dostępność została zapisana.</p>
              )}
              {submitAvailabilityMutation.isError && (
                <p className="text-xs text-red-600">{submitAvailabilityMutation.error?.response?.data?.message || 'Wystąpił błąd podczas zgłaszania dostępności.'}</p>
              )}
              {availabilityData && availabilityData.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Ostatnie zgłoszenia</p>
                  {availabilityData.slice(0, 3).map((item) => (
                    <div key={item._id} className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                      {fullDateFormatter.format(new Date(item.startDate))} - {fullDateFormatter.format(new Date(item.endDate))} · {item.preferredStartTime} - {item.preferredEndTime}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {summaryError && <p className="text-sm text-red-600">Nie udało się pobrać podsumowania.</p>}
    </div>
  );
};

export default Dashboard;
