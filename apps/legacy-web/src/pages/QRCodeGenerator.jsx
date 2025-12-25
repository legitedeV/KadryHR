import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import Alert from '../components/Alert';

const QRCodeGenerator = () => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Auto-generate token on mount
    generateToken();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (qrData && qrData.expiresAt) {
      // Start countdown
      const updateCountdown = () => {
        const now = Date.now();
        const expiresAt = new Date(qrData.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setCountdown(remaining);

        // Auto-refresh when expired
        if (remaining === 0) {
          generateToken();
        }
      };

      updateCountdown();
      intervalRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [qrData]);

  const generateToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/qr/generate-token', {
        validitySeconds: 120 // 2 minutes
      });

      setQrData(response.data);
      setSuccess('Kod QR wygenerowany pomyślnie!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się wygenerować kodu QR');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrSvg = document.getElementById('qr-code-svg').outerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kod QR - Start Pracy</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #333;
              padding: 40px;
              border-radius: 10px;
            }
            h1 {
              font-size: 32px;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 30px 0;
            }
            .instructions {
              margin-top: 30px;
              padding: 20px;
              background: #f9f9f9;
              border-radius: 5px;
              text-align: left;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Kod QR - Start Pracy</h1>
            <div class="qr-code">
              ${qrSvg}
            </div>
            <div class="instructions">
              <h3>Instrukcja użycia:</h3>
              <ol>
                <li>Zeskanuj kod QR swoim telefonem</li>
                <li>Zaloguj się do systemu KadryHR (jeśli nie jesteś zalogowany)</li>
                <li>Praca zostanie automatycznie rozpoczęta</li>
                <li>Kod QR odświeża się automatycznie co 2 minuty</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopy = () => {
    if (qrData && qrData.qrUrl) {
      navigator.clipboard.writeText(qrData.qrUrl);
      setSuccess('Link skopiowany do schowka!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Generator kodów QR</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Skanuj telefonem aby rozpocząć pracę</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* QR Code Display */}
      {qrData && (
        <div className="app-card p-6 animate-slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Aktywny kod QR
            </h2>
            <div className="flex items-center gap-2">
              <div 
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  countdown > 30 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : countdown > 10
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {countdown > 0 ? `Wygasa za ${formatCountdown(countdown)}` : 'Odświeżanie...'}
              </div>
              <button
                onClick={generateToken}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-xl shadow-lg mb-4">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrData.qrUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Zeskanuj kod QR swoim telefonem
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-mono break-all max-w-md">
                  {qrData.qrUrl}
                </p>
              </div>

              <div className="flex gap-3 w-full max-w-md">
                <button
                  onClick={handleCopy}
                  className="btn-secondary flex-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Kopiuj link
                </button>
                <button
                  onClick={handlePrint}
                  className="btn-primary flex-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Drukuj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Jak używać kodów QR?
        </h2>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-3">
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
              style={{
                backgroundColor: `rgba(var(--theme-primary-rgb), 0.1)`,
                color: 'var(--theme-primary)'
              }}
            >
              1
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Zeskanuj kod QR</p>
              <p>Użyj aparatu w swoim telefonie aby zeskanować kod QR wyświetlany na ekranie</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
              style={{
                backgroundColor: `rgba(var(--theme-primary-rgb), 0.1)`,
                color: 'var(--theme-primary)'
              }}
            >
              2
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Zaloguj się</p>
              <p>Jeśli nie jesteś zalogowany, zostaniesz przekierowany do strony logowania</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
              style={{
                backgroundColor: `rgba(var(--theme-primary-rgb), 0.1)`,
                color: 'var(--theme-primary)'
              }}
            >
              3
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Praca rozpoczęta</p>
              <p>System automatycznie rozpocznie śledzenie czasu pracy</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
              style={{
                backgroundColor: `rgba(var(--theme-primary-rgb), 0.1)`,
                color: 'var(--theme-primary)'
              }}
            >
              4
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Automatyczne odświeżanie</p>
              <p>Kod QR odświeża się automatycznie co 2 minuty dla bezpieczeństwa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="app-card p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Bezpieczeństwo
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Każdy kod QR jest ważny tylko przez 2 minuty i może być użyty tylko raz. 
              Po wygaśnięciu automatycznie generowany jest nowy kod. 
              Nie udostępniaj kodu QR osobom nieupoważnionym.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
