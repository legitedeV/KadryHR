# 📦 Wszystkie pliki - gotowe do ctrl+c ctrl+v

## Instrukcja:
1. Skopiuj zawartość każdego bloku kodu poniżej
2. Wklej do odpowiedniego pliku w swoim projekcie
3. Zapisz plik
4. Commit i push do GitHub
5. Deploy na VPS

---

## 🗂️ Plik 1: `frontend/src/App.jsx`

**Ścieżka:** `frontend/src/App.jsx`

```jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Invites from './pages/Invites';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import SelfService from './pages/SelfService';
import ScheduleBuilder from './pages/ScheduleBuilder';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Ładowanie...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/app" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Dashboard - accessible to all logged-in users */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Self-service panel */}
      <Route
        path="/self-service"
        element={
          <PrivateRoute>
            <Layout>
              <SelfService />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Schedule builder - accessible to all */}
      <Route
        path="/schedule-builder"
        element={
          <PrivateRoute>
            <Layout>
              <ScheduleBuilder />
            </Layout>
          </PrivateRoute>
        }
      />
      
      {/* Admin-only routes */}
      <Route
        path="/employees"
        element={
          <AdminRoute>
            <Layout>
              <Employees />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <AdminRoute>
            <Layout>
              <Payroll />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <AdminRoute>
            <Layout>
              <Reports />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/invites"
        element={
          <AdminRoute>
            <Layout>
              <Invites />
            </Layout>
          </AdminRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
```

---

## 🗂️ Plik 2: `frontend/src/pages/Dashboard.jsx`

**Ścieżka:** `frontend/src/pages/Dashboard.jsx`

```jsx
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
      const { data } = await api.get('/employees/me');
      return data.employee || null;
    },
    enabled: !isAdmin,
  });

  // Schedule data (filtered by user if not admin)
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useQuery({
    queryKey: ['schedule', isAdmin ? 'all' : 'user', currentEmployee?._id],
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
    queryKey: ['availability', 'user', currentEmployee?._id],
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
      </div>

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
```

---

## 🗂️ Plik 3: `frontend/src/components/Navbar.jsx`

**Ścieżka:** `frontend/src/components/Navbar.jsx`

```jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const linkClasses = ({ isActive }) =>
    [
      'px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap',
      isActive
        ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 shadow-sm'
        : 'text-slate-600 hover:bg-pink-50 hover:text-pink-700',
    ].join(' ');

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
      <nav className="app-shell flex items-center justify-between h-14 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-pink-500/30">
            KH
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">KadryHR</span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user && (
            <>
              <NavLink to="/app" className={linkClasses} end>
                Dashboard
              </NavLink>
              <NavLink to="/self-service" className={linkClasses}>
                Panel pracownika
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/employees" className={linkClasses}>
                    Pracownicy
                  </NavLink>
                  <NavLink to="/payroll" className={linkClasses}>
                    Kalkulator
                  </NavLink>
                  <NavLink to="/reports" className={linkClasses}>
                    Raporty
                  </NavLink>
                  <NavLink to="/schedule-builder" className={linkClasses}>
                    Grafik miesięczny
                  </NavLink>
                  <NavLink to="/invites" className={linkClasses}>
                    Zaproszenia
                  </NavLink>
                </>
              )}
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user && (
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                {user.name}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-pink-600 font-semibold">
                {user.role === 'admin' || user.role === 'super_admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
              </div>
            </div>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border-2 border-pink-200 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-50 transition-all duration-200"
            >
              Wyloguj
            </button>
          ) : (
            <NavLink
              to="/login"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all duration-200"
            >
              Zaloguj
            </NavLink>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {user && (
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-900 truncate max-w-[110px]">
                {user.name}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-pink-600">
                {user.role === 'admin' || user.role === 'super_admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 h-8 w-8 text-slate-700 hover:bg-slate-50"
          >
            <span className="sr-only">Menu</span>
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {user && open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="app-shell py-2 space-y-1">
            <NavLink
              to="/app"
              end
              onClick={() => setOpen(false)}
              className={linkClasses}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/self-service"
              onClick={() => setOpen(false)}
              className={linkClasses}
            >
              Panel pracownika
            </NavLink>
            {isAdmin && (
              <>
                <NavLink
                  to="/employees"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Pracownicy
                </NavLink>
                <NavLink
                  to="/payroll"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Kalkulator
                </NavLink>
                <NavLink
                  to="/reports"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Raporty
                </NavLink>
                <NavLink
                  to="/schedule-builder"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Grafik miesięczny
                </NavLink>
                <NavLink
                  to="/invites"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  Zaproszenia
                </NavLink>
              </>
            )}

            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="mt-1 inline-flex w-full items-center justify-center rounded-full border border-pink-200 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-50"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
```

---

## 🗂️ Plik 4: `frontend/src/pages/SelfService.jsx`

**Ścieżka:** `frontend/src/pages/SelfService.jsx`

```jsx
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const categoryLabels = {
  pomysl: 'Pomysł / ulepszenie',
  problem: 'Zgłoszenie problemu',
  proces: 'Usprawnienie procesu',
  inne: 'Inne',
};

const SelfService = () => {
  const queryClient = useQueryClient();
  const [suggestionPayload, setSuggestionPayload] = useState({
    title: '',
    content: '',
    category: 'pomysl',
  });
  const [leavePayload, setLeavePayload] = useState({
    employeeId: '',
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [swapPayload, setSwapPayload] = useState({
    requesterEmployee: '',
    swapWithEmployee: '',
    date: '',
    reason: '',
  });

  const { data: employeesData, error: employeesError, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', 'compact'],
    queryFn: async () => {
      console.log('[SelfService] Pobieranie listy pracowników...');
      const { data } = await api.get('/employees/compact');
      console.log('[SelfService] Pobrano pracowników:', data.employees?.length || 0);
      return data.employees || [];
    },
    retry: 1,
    onError: (err) => {
      console.error('[SelfService] Błąd pobierania pracowników:', err.response?.data?.message || err.message);
    },
  });

  const { data: suggestions, error: suggestionsError, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      console.log('[SelfService] Pobieranie sugestii...');
      const { data } = await api.get('/suggestions');
      console.log('[SelfService] Pobrano sugestie:', data?.length || 0);
      return data;
    },
    retry: 1,
    onError: (err) => {
      console.error('[SelfService] Błąd pobierania sugestii:', err.response?.data?.message || err.message);
    },
  });

  const { data: swapRequests, error: swapRequestsError, isLoading: swapRequestsLoading } = useQuery({
    queryKey: ['swap-requests'],
    queryFn: async () => {
      console.log('[SelfService] Pobieranie próśb o zamianę...');
      const { data } = await api.get('/swap-requests');
      console.log('[SelfService] Pobrano prośby o zamianę:', data?.length || 0);
      return data;
    },
    retry: 1,
    onError: (err) => {
      console.error('[SelfService] Błąd pobierania próśb o zamianę:', err.response?.data?.message || err.message);
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: (payload) => api.post('/suggestions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      setSuggestionPayload({ title: '', content: '', category: 'pomysl' });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (payload) => api.post('/leaves', payload),
    onSuccess: () => setLeavePayload({
      employeeId: '',
      type: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
    }),
  });

  const swapMutation = useMutation({
    mutationFn: (payload) => api.post('/swap-requests', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      setSwapPayload({ requesterEmployee: '', swapWithEmployee: '', date: '', reason: '' });
    },
  });

  const compactEmployees = useMemo(() => employeesData || [], [employeesData]);

  // Sprawdź czy są błędy autoryzacji
  const hasAuthError = employeesError || suggestionsError || swapRequestsError;
  const authErrorMessage = 
    employeesError?.response?.data?.message || 
    suggestionsError?.response?.data?.message || 
    swapRequestsError?.response?.data?.message;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">Panel pracownika</h1>
        <p className="text-sm text-slate-600">
          Zgłaszaj sugestie, wnioski urlopowe oraz prośby o zamianę zmian w jednym miejscu.
        </p>
      </header>

      {hasAuthError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Błąd autoryzacji</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{authErrorMessage || 'Wystąpił problem z autoryzacją. Spróbuj zalogować się ponownie.'}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Przejdź do logowania
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(employeesLoading || suggestionsLoading || swapRequestsLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-sm text-blue-700">Ładowanie danych...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="app-card p-4 space-y-3 lg:col-span-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Sugestie / pomysły</div>
            <p className="text-xs text-slate-600">Wyślij pomysł lub zgłoś problem do zespołu HR.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={suggestionPayload.title}
              onChange={(e) => setSuggestionPayload((p) => ({ ...p, title: e.target.value }))}
              placeholder="Tytuł"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <select
              value={suggestionPayload.category}
              onChange={(e) => setSuggestionPayload((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={suggestionPayload.content}
            onChange={(e) => setSuggestionPayload((p) => ({ ...p, content: e.target.value }))}
            placeholder="Opisz swoją sugestię"
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => suggestionMutation.mutate(suggestionPayload)}
              disabled={suggestionMutation.isLoading}
              className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
            >
              {suggestionMutation.isLoading ? 'Wysyłanie...' : 'Dodaj sugestię'}
            </button>
          </div>

          <div className="pt-2 space-y-2">
            {(suggestions || []).map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500">{categoryLabels[item.category] || item.category}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-pink-700">{item.status}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.content}</p>
              </div>
            ))}
            {(suggestions || []).length === 0 && (
              <div className="text-xs text-slate-500">Brak sugestii. Dodaj pierwszą powyżej.</div>
            )}
          </div>
        </div>

        <div className="app-card p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Wniosek urlopowy</div>
            <p className="text-xs text-slate-600">Zgłoś urlop do akceptacji administratora.</p>
          </div>
          <select
            value={leavePayload.employeeId}
            onChange={(e) => setLeavePayload((p) => ({ ...p, employeeId: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Wybierz pracownika</option>
            {compactEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <select
            value={leavePayload.type}
            onChange={(e) => setLeavePayload((p) => ({ ...p, type: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="annual">Urlop wypoczynkowy</option>
            <option value="on_demand">Urlop na żądanie</option>
            <option value="unpaid">Urlop bezpłatny</option>
            <option value="occasional">Urlop okolicznościowy</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={leavePayload.startDate}
              onChange={(e) => setLeavePayload((p) => ({ ...p, startDate: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <input
              type="date"
              value={leavePayload.endDate}
              onChange={(e) => setLeavePayload((p) => ({ ...p, endDate: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <textarea
            value={leavePayload.reason}
            onChange={(e) => setLeavePayload((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Powód (opcjonalnie)"
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="button"
            onClick={() => leaveMutation.mutate(leavePayload)}
            disabled={leaveMutation.isLoading}
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
          >
            {leaveMutation.isLoading ? 'Wysyłanie...' : 'Złóż wniosek urlopowy'}
          </button>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-600">
              Po akceptacji przez admina kolidujące zmiany w grafiku zostaną usunięte.
            </div>
          </div>
        </div>
      </div>

      <div className="app-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Prośba o zamianę zmiany</div>
            <p className="text-xs text-slate-600">Wybierz datę i pracownika, z którym chcesz się zamienić.</p>
          </div>
          <span className="text-[11px] font-semibold text-pink-700">Grafik</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={swapPayload.requesterEmployee}
            onChange={(e) => setSwapPayload((p) => ({ ...p, requesterEmployee: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Ja / mój profil</option>
            {compactEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <select
            value={swapPayload.swapWithEmployee}
            onChange={(e) => setSwapPayload((p) => ({ ...p, swapWithEmployee: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Pracownik do zamiany</option>
            {compactEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={swapPayload.date}
            onChange={(e) => setSwapPayload((p) => ({ ...p, date: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="text"
            value={swapPayload.reason}
            onChange={(e) => setSwapPayload((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Powód (opcjonalnie)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => swapMutation.mutate(swapPayload)}
            disabled={swapMutation.isLoading}
            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
          >
            {swapMutation.isLoading ? 'Wysyłanie...' : 'Poproś o zamianę'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
          {(swapRequests || []).map((swap) => (
            <div key={swap._id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  {swap.requesterEmployee?.firstName} {swap.requesterEmployee?.lastName}
                </div>
                <span className="text-[11px] font-semibold text-pink-700">{swap.status}</span>
              </div>
              <div className="text-xs text-slate-600">
                Zamiana z {swap.swapWithEmployee?.firstName} {swap.swapWithEmployee?.lastName} - {new Date(swap.date).toLocaleDateString('pl-PL')}
              </div>
              {swap.reason && (
                <div className="text-[11px] text-slate-500 mt-1">{swap.reason}</div>
              )}
            </div>
          ))}
          {(swapRequests || []).length === 0 && (
            <div className="text-xs text-slate-500">Brak próśb o zamianę.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfService;
```

---

## 🗂️ Plik 5: `backend/routes/employeeRoutes.js`

**Ścieżka:** `backend/routes/employeeRoutes.js`

```javascript
const express = require('express');
const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/employees/summary
 * Proste dane do dashboardu
 */
router.get(
  '/summary',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employees = await Employee.find({}, 'monthlySalary hourlyRate hoursPerMonth isActive');

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.isActive !== false).length;

    const totalPayrollAmount = employees.reduce((sum, emp) => {
      const baseSalary =
        (emp.monthlySalary && emp.monthlySalary > 0)
          ? emp.monthlySalary
          : (emp.hourlyRate || 0) * (emp.hoursPerMonth || 160);

      return sum + baseSalary;
    }, 0);

    res.json({
      totalEmployees,
      activeEmployees,
      totalPayrollAmount: Math.round(totalPayrollAmount),
    });
  })
);

// uproszczona lista do wyborów (np. zamiany w grafiku)
router.get(
  '/compact',
  protect,
  asyncHandler(async (req, res) => {
    const employees = await Employee.find(
      {},
      'firstName lastName position isActive'
    ).sort({ firstName: 1 });

    res.json({ employees });
  })
);

/**
 * GET /api/employees/me
 * Dane powiązanego pracownika dla aktualnie zalogowanego użytkownika
 */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId, isActive: true });

    if (!employee) {
      return res.status(404).json({
        message: 'Brak przypisanego profilu pracownika do tego użytkownika.',
      });
    }

    res.json({ employee });
  })
);

/**
 * GET /api/employees
 * Lista wszystkich pracowników
 */
router.get(
  '/',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ employees });
  })
);

/**
 * POST /api/employees
 * Dodanie pracownika
 */
router.post(
  '/',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.create(req.body);
    res.status(201).json({ employee });
  })
);

/**
 * GET /api/employees/:id
 * Szczegóły pracownika
 */
router.get(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    res.json({ employee });
  })
);

/**
 * PATCH /api/employees/:id
 * Aktualizacja pracownika
 */
router.patch(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    res.json({ employee });
  })
);

/**
 * DELETE /api/employees/:id
 * Usunięcie pracownika
 */
router.delete(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    res.json({ message: 'Pracownik został usunięty.' });
  })
);

module.exports = router;
```

---

## 🚀 Szybkie wdrożenie

### Krok 1: Skopiuj pliki

Otwórz każdy plik w swoim edytorze i wklej odpowiednią zawartość z powyższych bloków kodu.

### Krok 2: Commit i push

```bash
git add frontend/src/App.jsx frontend/src/pages/Dashboard.jsx frontend/src/components/Navbar.jsx frontend/src/pages/SelfService.jsx backend/routes/employeeRoutes.js

git commit -m "feat: unified dashboard, availability suggestions, pink/rose theme

- Dashboard adapts to user role (admin/user)
- Added next shift countdown widget
- Added availability suggestions for users
- Updated all colors to pink/rose gradient
- Added /api/employees/me endpoint
- Fixed routing and removed duplicates"

git push origin main
```

### Krok 3: Deploy

```bash
ssh deploy@vps-63e4449f
cd /home/deploy/apps/kadryhr-app
git pull origin main
./deploy.sh
```

---

## ✅ Gotowe!

Wszystkie pliki są kompletne i gotowe do wklejenia. Każdy blok kodu można skopiować bezpośrednio do odpowiedniego pliku.

**Powodzenia z wdrożeniem! 🎉**
