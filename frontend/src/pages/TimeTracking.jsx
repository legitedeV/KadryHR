import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import QRGenerator from '../components/QRGenerator';

const TimeTracking = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [manualQR, setManualQR] = useState('');
  const [selectedAction, setSelectedAction] = useState('clock-in');
  const [noEmployeeLinked, setNoEmployeeLinked] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchEntries();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/time-tracking/status');
      setStatus(response.data);
      setNoEmployeeLinked(false);
    } catch (err) {
      console.error('Error fetching status:', err);
      if (err.response?.status === 404) {
        setNoEmployeeLinked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await api.get('/time-tracking/my-entries?limit=10');
      setEntries(response.data.entries || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
    }
  };

  const handleScan = async (qrCode) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/time-tracking/scan', {
        qrCode,
        type: selectedAction,
        latitude: null,
        longitude: null,
        notes: ''
      });

      let successMessage = response.data.message;
      if (response.data.duration) {
        successMessage = `${response.data.message} (Czas pracy: ${response.data.duration} min)`;
      }
      if (response.data.autoClocked) {
        successMessage += ' ⚠️ Automatyczne zamknięcie po 10 godzinach';
      }
      setSuccess(successMessage);

      // Refresh status and entries
      await fetchStatus();
      await fetchEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się zarejestrować czasu pracy');
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualQR.trim()) {
      setError('Wprowadź kod QR');
      return;
    }
    await handleScan(manualQR.trim());
    setManualQR('');
  };

  const getStatusColor = () => {
    if (!status) return 'bg-slate-100 text-slate-700';
    switch (status.status) {
      case 'clocked-in':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200';
      case 'on-break':
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'clock-in':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'clock-out':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      case 'break-start':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'break-end':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getActionLabel = (type) => {
    const labels = {
      'clock-in': 'Rozpoczęcie pracy',
      'clock-out': 'Zakończenie pracy',
      'break-start': 'Rozpoczęcie przerwy',
      'break-end': 'Zakończenie przerwy'
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !status && !noEmployeeLinked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Show helpful message if no employee is linked
  if (noEmployeeLinked) {
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="app-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
              style={{
                background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
              }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rejestracja czasu pracy</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Skanuj kod QR aby zarejestrować czas</p>
            </div>
          </div>
        </div>

        {/* No Employee Linked Message */}
        <div className="app-card p-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-2">
                  Brak powiązanego profilu pracownika
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-400 mb-4">
                  {isAdmin 
                    ? 'Twoje konto administratora nie jest powiązane z profilem pracownika. Funkcja rejestracji czasu pracy jest dostępna tylko dla kont pracowników.'
                    : 'Twoje konto użytkownika nie jest powiązane z profilem pracownika w systemie.'
                  }
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {isAdmin ? 'Opcje dla administratora:' : 'Co możesz zrobić:'}
                  </h4>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    {isAdmin ? (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-theme-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>Jeśli chcesz korzystać z rejestracji czasu, przejdź do sekcji <strong>Pracownicy</strong> i powiąż swoje konto z profilem pracownika</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-theme-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>Jako administrator możesz zarządzać czasem pracy innych pracowników z poziomu panelu administracyjnego</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-theme-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>Skontaktuj się z administratorem systemu</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-theme-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>Poproś o powiązanie Twojego konta z profilem pracownika</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="app-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rejestracja czasu pracy</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Skanuj kod QR aby zarejestrować czas</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Current Status */}
      {status && (
        <div className={`app-card p-6 border-2 ${getStatusColor()}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Aktualny status</h2>
              <p className="text-2xl font-bold">{status.statusLabel}</p>
              {status.currentSessionStart && (
                <p className="text-sm mt-2">
                  Czas trwania: <span className="font-semibold">{status.currentSessionDuration} min</span>
                  {status.timeRemaining > 0 && (
                    <span className="ml-2">
                      (pozostało: <span className="font-semibold">{status.timeRemaining} min</span>)
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{status.employee.firstName} {status.employee.lastName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{status.employee.position}</p>
            </div>
          </div>

          {/* Time Progress Bar */}
          {status.currentSessionStart && status.maxWorkMinutes && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Czas pracy</span>
                <span className="font-semibold">
                  {Math.floor(status.currentSessionDuration / 60)}h {status.currentSessionDuration % 60}m / {Math.floor(status.maxWorkMinutes / 60)}h
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status.warningLevel === 'critical'
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : status.warningLevel === 'warning'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min((status.currentSessionDuration / status.maxWorkMinutes) * 100, 100)}%`
                  }}
                />
              </div>
              
              {/* Warning Messages */}
              {status.willAutoClockOut && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                        Osiągnięto maksymalny czas pracy!
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        Twoja sesja zostanie automatycznie zakończona. Maksymalny czas pracy to 10 godzin.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {status.warningLevel === 'critical' && !status.willAutoClockOut && (
                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                        Zbliżasz się do limitu czasu pracy
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                        Pozostało mniej niż 30 minut. Pamiętaj o wylogowaniu się przed osiągnięciem 10 godzin.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {status.warningLevel === 'warning' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                        Uwaga: Długi czas pracy
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Pracujesz już ponad 9 godzin. Maksymalny czas pracy to 10 godzin.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Selection */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Wybierz akcję</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['clock-in', 'clock-out', 'break-start', 'break-end'].map((action) => (
            <button
              key={action}
              onClick={() => setSelectedAction(action)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedAction === action
                  ? 'border-2 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              style={
                selectedAction === action
                  ? {
                      borderColor: 'var(--theme-primary)',
                      backgroundColor: `rgba(var(--theme-primary-rgb), 0.05)`,
                      boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.2)`
                    }
                  : {}
              }
            >
              <div 
                className="transition-colors duration-200"
                style={selectedAction === action ? { color: 'var(--theme-primary)' } : {}}
              >
                {getActionIcon(action)}
              </div>
              <span className="text-xs font-medium text-center text-slate-700 dark:text-slate-300">
                {getActionLabel(action)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* QR Generator */}
      <QRGenerator />

      {/* Manual QR Input */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Wprowadź kod QR</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Wprowadź kod QR wygenerowany powyżej, aby zarejestrować czas pracy.
        </p>
        <form onSubmit={handleManualScan} className="flex gap-2">
          <input
            type="text"
            value={manualQR}
            onChange={(e) => setManualQR(e.target.value)}
            placeholder="Wprowadź kod QR"
            className="input-primary flex-1"
          />
          <button
            type="submit"
            disabled={loading || !manualQR.trim()}
            className="btn-primary"
          >
            Wyślij
          </button>
        </form>
      </div>

      {/* Recent Entries */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Ostatnie wpisy
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            Brak wpisów
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: `rgba(var(--theme-primary-rgb), 0.1)`,
                      color: 'var(--theme-primary)'
                    }}
                  >
                    {getActionIcon(entry.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {getActionLabel(entry.type)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(entry.timestamp)}
                    </p>
                  </div>
                </div>
                {entry.duration > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {entry.duration} min
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Czas pracy</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracking;
