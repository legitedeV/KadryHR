import React, { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const dayFormatter = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'long',
});

const fullDateFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
  hour: '2-digit',
  minute: '2-digit',
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
      return 'bg-pink-100 text-pink-700';
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

const weekdays = [
  { value: 1, label: 'Pon' },
  { value: 2, label: 'Wt' },
  { value: 3, label: 'Śr' },
  { value: 4, label: 'Czw' },
  { value: 5, label: 'Pt' },
  { value: 6, label: 'Sob' },
  { value: 0, label: 'Niedz' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const queryClient = useQueryClient();

  // State for admin features
  const [newNotification, setNewNotification] = useState('');
  const [notificationError, setNotificationError] = useState(null);

  // State for user availability form
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

  // Next shift countdown state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // === QUERIES ===

  // Admin summary
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
    enabled: isAdmin,
  });

  // Get current user's employee record
  const { data: currentEmployee } = useQuery({
    queryKey: ['current-employee'],
    queryFn: async () => {
      const { data } = await api.get('/employees/compact');
      const employees = data.employees || [];
      // Find employee linked to current user
      // Note: This assumes employee.user field exists and matches user.id
      // If not available, you may need a dedicated endpoint
      return employees.find(emp => emp._id) || null;
    },
    enabled: !isAdmin,
  });

  // Schedule data (filtered by user if not admin)
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useQuery({
    queryKey: ['schedule', isAdmin ? 'all' : 'user'],
    queryFn: async () => {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 30);

      const params = {
        from: from.toISOString(),
        to: to.toISOString(),
      };

      // If user (not admin), filter by their employee ID
      if (!isAdmin && currentEmployee?._id) {
        params.employeeId = currentEmployee._id;
      }

      const { data } = await api.get('/schedule', { params });
      return data;
    },
    enabled: isAdmin || !!currentEmployee,
  });

  // Leaves data
  const {
    data: leavesData,
    isLoading: leavesLoading,
    error: leavesError,
  } = useQuery({
    queryKey: ['leaves', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/leaves', {
        params: isAdmin ? { status: 'pending' } : {},
      });
      return data;
    },
  });

  // Sick leaves
  const {
    data: sickLeavesData,
    isLoading: sickLoading,
    error: sickError,
  } = useQuery({
    queryKey: ['sick-leaves', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/sick-leaves');
      return data;
    },
    enabled: isAdmin,
  });

  // Notifications
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
  });

  // User's availability submissions
  const {
    data: availabilityData,
    isLoading: availabilityLoading,
  } = useQuery({
    queryKey: ['availability', 'user'],
    queryFn: async () => {
      if (!currentEmployee?._id) return [];
      const { data } = await api.get('/availability', {
        params: { employeeId: currentEmployee._id },
      });
      return data;
    },
    enabled: !isAdmin && !!currentEmployee,
  });

  // === MUTATIONS ===

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

  // === HANDLERS ===

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

  const toggleAvailabilityDay = (dayValue) => {
    setAvailabilityForm((prev) => {
      const exists = prev.daysOfWeek.includes(dayValue);
      return {
        ...prev,
        daysOfWeek: exists
          ? prev.daysOfWeek.filter((d) => d !== dayValue)
          : [...prev.daysOfWeek, dayValue],
      };
    });
  };

  const handleSubmitAvailability = () => {
    if (!availabilityForm.startDate || !availabilityForm.endDate || !currentEmployee?._id) return;
    
    submitAvailabilityMutation.mutate({
      employeeId: currentEmployee._id,
      ...availabilityForm,
    });
  };

  // === COMPUTED DATA ===

  // Next shift for countdown
  const nextShift = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return null;

    const now = new Date();
    const upcoming = scheduleData
      .filter((entry) => {
        const shiftDate = new Date(entry.date);
        return shiftDate >= now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return upcoming[0] || null;
  }, [scheduleData]);

  // Update countdown every second
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
          person: entry.employee
            ? `${entry.employee.firstName} ${entry.employee.lastName}`
            : 'Pracownik',
          location: entry.employee?.position || 'Zmiana',
          sortKey: date.getTime(),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, isAdmin ? 6 : 5);
  }, [scheduleData, isAdmin]);

  const timeOffItems = useMemo(() => {
    const leaveItems = (leavesData || []).map((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return {
        id: leave._id,
        employee: leave.employee
          ? `${leave.employee.firstName} ${leave.employee.lastName}`
          : 'Pracownik',
        range: `${fullDateFormatter.format(start)} - ${fullDateFormatter.format(end)}`,
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
        range: `${fullDateFormatter.format(start)} - ${fullDateFormatter.format(end)}`,
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

  // === RENDER ===

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">
          {isAdmin ? 'Dashboard Administratora' : 'Mój Dashboard'}
        </h1>
        <p className="text-sm text-slate-600">
          {isAdmin
            ? 'Przegląd kluczowych metryk i nadchodzących wydarzeń'
            : 'Twoje zmiany, dostępność i powiadomienia'}
        </p>
      </header>

      {/* Next Shift Countdown - For all users */}
      {nextShift && (
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl border border-pink-200 shadow-lg shadow-pink-500/30 p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
                Następna zmiana
              </div>
              <div className="text-2xl font-bold mt-1">
                {fullDateFormatter.format(new Date(nextShift.date))}
              </div>
              <div className="text-sm opacity-90 mt-1">
                {nextShift.startTime} - {nextShift.endTime}
                {nextShift.employee && (
                  <span className="ml-2">
                    · {nextShift.employee.firstName} {nextShift.employee.lastName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold">{countdown.days}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Dni</div>
              </div>
              <div className="text-3xl font-bold opacity-60">:</div>
              <div className="text-center">
                <div className="text-3xl font-bold">{countdown.hours}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Godz</div>
              </div>
              <div className="text-3xl font-bold opacity-60">:</div>
              <div className="text-center">
                <div className="text-3xl font-bold">{countdown.minutes}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Min</div>
              </div>
              <div className="text-3xl font-bold opacity-60">:</div>
              <div className="text-center">
                <div className="text-3xl font-bold">{countdown.seconds}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Sek</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Metrics */}
      {isAdmin && (
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
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Shifts */}
        <div className="app-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {isAdmin ? 'Najbliższe zmiany (wszyscy)' : 'Moje najbliższe zmiany'}
              </h2>
              <p className="text-[11px] text-slate-500">Grafik pracy na kolejne dni.</p>
            </div>
            <span className="text-[11px] font-medium text-pink-600">Grafik</span>
          </div>

          {(scheduleLoading || upcomingShifts.length === 0) && (
            <div className="text-[11px] text-slate-500">
              {scheduleLoading ? 'Ładowanie grafiku...' : 'Brak zaplanowanych zmian.'}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingShifts.map((shift) => (
              <div
                key={shift.id}
                className="rounded-xl border border-pink-100 bg-pink-50/70 px-3 py-3"
              >
                <div className="text-[11px] font-semibold text-pink-700">{shift.label}</div>
                <div className="text-sm font-semibold text-slate-900">{shift.time}</div>
                <div className="text-[11px] text-slate-600">{shift.person}</div>
                <div className="text-[11px] text-slate-500 mt-1">{shift.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Off / Availability */}
        <div className="app-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {isAdmin ? 'Urlopy i L4' : 'Moje wnioski'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isAdmin ? 'Ostatnie zgłoszenia i statusy.' : 'Status wniosków urlopowych.'}
              </p>
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

      {/* User: Availability Suggestions */}
      {!isAdmin && (
        <div className="app-card p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Sugestie dyspozycyjności</h2>
            <p className="text-xs text-slate-600">
              Zgłoś swoją dostępność na nadchodzące okresy grafiku. Administrator zatwierdzi Twoje preferencje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Od (data)</label>
              <input
                type="date"
                value={availabilityForm.startDate}
                onChange={(e) =>
                  setAvailabilityForm((p) => ({ ...p, startDate: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Do (data)</label>
              <input
                type="date"
                value={availabilityForm.endDate}
                onChange={(e) =>
                  setAvailabilityForm((p) => ({ ...p, endDate: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Typ dostępności</label>
              <select
                value={availabilityForm.type}
                onChange={(e) =>
                  setAvailabilityForm((p) => ({ ...p, type: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="available">Dostępny</option>
                <option value="preferred">Preferowany</option>
                <option value="unavailable">Niedostępny</option>
                <option value="limited">Ograniczony</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Dni tygodnia</div>
              <div className="flex flex-wrap gap-1.5">
                {weekdays.map((day) => {
                  const active = availabilityForm.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleAvailabilityDay(day.value)}
                      className={[
                        'px-2.5 py-1 rounded-full text-xs border transition-all',
                        active
                          ? 'bg-gradient-to-r from-pink-100 to-rose-100 border-pink-200 text-pink-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300',
                      ].join(' ')}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Preferowane godziny</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600">Od</label>
                  <input
                    type="time"
                    value={availabilityForm.preferredStartTime}
                    onChange={(e) =>
                      setAvailabilityForm((p) => ({ ...p, preferredStartTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600">Do</label>
                  <input
                    type="time"
                    value={availabilityForm.preferredEndTime}
                    onChange={(e) =>
                      setAvailabilityForm((p) => ({ ...p, preferredEndTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Max godz. dziennie</label>
              <input
                type="number"
                min="1"
                max="12"
                value={availabilityForm.maxHoursPerDay}
                onChange={(e) =>
                  setAvailabilityForm((p) => ({ ...p, maxHoursPerDay: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Max godz. tygodniowo</label>
              <input
                type="number"
                min="1"
                max="60"
                value={availabilityForm.maxHoursPerWeek}
                onChange={(e) =>
                  setAvailabilityForm((p) => ({ ...p, maxHoursPerWeek: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Notatki (opcjonalnie)</label>
              <input
                type="text"
                value={availabilityForm.notes}
                onChange={(e) =>
                  setAvailabilityForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Dodatkowe informacje"
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitAvailability}
              disabled={
                submitAvailabilityMutation.isLoading ||
                !availabilityForm.startDate ||
                !availabilityForm.endDate
              }
              className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {submitAvailabilityMutation.isLoading ? 'Wysyłanie...' : 'Zgłoś dostępność'}
            </button>
          </div>

          {submitAvailabilityMutation.isSuccess && (
            <div className="text-xs text-emerald-600">
              Dostępność została zgłoszona i oczekuje na zatwierdzenie przez administratora.
            </div>
          )}

          {submitAvailabilityMutation.isError && (
            <div className="text-xs text-red-600">
              {submitAvailabilityMutation.error?.response?.data?.message ||
                'Wystąpił błąd podczas zgłaszania dostępności.'}
            </div>
          )}

          {/* List of submitted availabilities */}
          {availabilityData && availabilityData.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Twoje zgłoszenia dostępności
              </div>
              <div className="space-y-2">
                {availabilityData.slice(0, 5).map((avail) => (
                  <div key={avail._id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {fullDateFormatter.format(new Date(avail.startDate))} -{' '}
                          {fullDateFormatter.format(new Date(avail.endDate))}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {avail.type} · {avail.preferredStartTime} - {avail.preferredEndTime}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${statusBadge(
                          avail.status
                        )}`}
                      >
                        {getStatusLabel(avail.status)}
                      </span>
                    </div>
                    {avail.notes && (
                      <div className="text-[11px] text-slate-600 mt-1">{avail.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="app-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Powiadomienia wewnętrzne</h2>
            <span className="text-[11px] font-medium text-pink-600">
              {notificationsLoading ? 'Ładowanie...' : `${unreadCount} do przeczytania`}
            </span>
          </div>

          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={newNotification}
                onChange={(e) => setNewNotification(e.target.value)}
                placeholder="Dodaj krótką notatkę / komunikat"
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                type="button"
                onClick={addNotification}
                disabled={createNotificationMutation.isLoading}
                className="inline-flex justify-center rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
              >
                {createNotificationMutation.isLoading ? 'Zapisywanie...' : 'Dodaj'}
              </button>
            </div>
          )}

          {notificationError && (
            <div className="mb-3 text-[11px] text-red-600">{notificationError}</div>
          )}

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className="flex items-start justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{alert.title}</div>
                  <div className="text-[11px] text-slate-600">{alert.message}</div>
                  <div className="text-[10px] uppercase tracking-wide text-pink-600 mt-1">
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
                      : 'border-pink-200 text-pink-700 bg-pink-50'
                  }`}
                >
                  {alert.read ? 'Przeczytane' : 'Oznacz jako przeczytane'}
                </button>
              </div>
            ))}
            {alerts.length === 0 && !notificationsLoading && (
              <div className="text-[11px] text-slate-500">
                Brak powiadomień. {isAdmin && 'Dodaj komunikat lub poczekaj na automatyczne wpisy.'}
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="app-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Szybkie akcje</h2>
            <p className="text-[11px] text-slate-600">
              Dodawaj natychmiastowe wpisy do grafiku, urlopów i powiadomień.
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAction('schedule')}
                className="w-full rounded-lg border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 hover:bg-pink-100"
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
