import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';
import Alert from '../components/Alert';

const TimeTracking = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [manualQR, setManualQR] = useState('');
  const [selectedAction, setSelectedAction] = useState('clock-in');
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    fetchEntries();
  }, []);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/time-tracking/status');
      setStatus(response.data);
    } catch (err) {
      console.error('Error fetching status:', err);
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

  const startScanner = () => {
    setScanning(true);
    setError(null);
    setSuccess(null);

    setTimeout(() => {
      if (scannerRef.current && !html5QrcodeScannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render(onScanSuccess, onScanError);
        html5QrcodeScannerRef.current = scanner;
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(console.error);
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    stopScanner();
    await handleScan(decodedText);
  };

  const onScanError = (errorMessage) => {
    // Ignore scan errors (they happen frequently during scanning)
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

      setSuccess(response.data.message);
      if (response.data.duration) {
        setSuccess(`${response.data.message} (Czas pracy: ${response.data.duration} min)`);
      }

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

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Ładowanie...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Aktualny status</h2>
              <p className="text-2xl font-bold">{status.statusLabel}</p>
              {status.currentSessionStart && (
                <p className="text-sm mt-2">
                  Czas trwania: <span className="font-semibold">{status.currentSessionDuration} min</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{status.employee.firstName} {status.employee.lastName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{status.employee.position}</p>
            </div>
          </div>
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

      {/* QR Scanner */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Skanowanie kodu QR</h2>
        
        {!scanning ? (
          <div className="text-center py-8">
            <button
              onClick={startScanner}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Uruchom skaner
            </button>
          </div>
        ) : (
          <div>
            <div ref={scannerRef} id="qr-reader" className="rounded-xl overflow-hidden"></div>
            <button
              onClick={stopScanner}
              className="btn-secondary mt-4 w-full"
            >
              Zatrzymaj skaner
            </button>
          </div>
        )}

        {/* Manual QR Input */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Lub wprowadź kod ręcznie
          </h3>
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
