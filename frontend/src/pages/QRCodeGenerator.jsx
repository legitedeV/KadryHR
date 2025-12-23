import React, { useState } from 'react';
import api from '../api/axios';
import Alert from '../components/Alert';

const QRCodeGenerator = () => {
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/time-tracking/generate-qr', {
        locationName,
        description
      });

      setGeneratedQR(response.data);
      setSuccess('Kod QR wygenerowany pomyślnie!');
      setLocationName('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się wygenerować kodu QR');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kod QR - ${generatedQR.locationName}</title>
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
              margin-bottom: 10px;
            }
            .qr-code {
              font-size: 48px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 30px 0;
              padding: 20px;
              background: #f0f0f0;
              border-radius: 10px;
              word-break: break-all;
            }
            .description {
              font-size: 18px;
              color: #666;
              margin-top: 20px;
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
            <h1>${generatedQR.locationName}</h1>
            <div class="qr-code">${generatedQR.qrCode}</div>
            ${generatedQR.description ? `<div class="description">${generatedQR.description}</div>` : ''}
            <div class="instructions">
              <h3>Instrukcja użycia:</h3>
              <ol>
                <li>Otwórz aplikację KadryHR</li>
                <li>Przejdź do zakładki "Rejestracja czasu"</li>
                <li>Zeskanuj ten kod QR lub wprowadź go ręcznie</li>
                <li>Wybierz odpowiednią akcję (rozpoczęcie/zakończenie pracy)</li>
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
    navigator.clipboard.writeText(generatedQR.qrCode);
    setSuccess('Kod QR skopiowany do schowka!');
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Generuj kody QR dla lokalizacji</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Generator Form */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Wygeneruj nowy kod QR
        </h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nazwa lokalizacji *
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="np. Wejście główne, Magazyn, Biuro"
              className="input-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Opis (opcjonalnie)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dodatkowe informacje o lokalizacji"
              className="textarea-primary"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !locationName.trim()}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generowanie...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Wygeneruj kod QR
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Generated QR Code */}
      {generatedQR && (
        <div className="app-card p-6 animate-slide-in-up">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Wygenerowany kod QR
          </h2>
          
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {generatedQR.locationName}
              </h3>
              {generatedQR.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {generatedQR.description}
                </p>
              )}
            </div>

            <div 
              className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-4 border-2 transition-all duration-300"
              style={{ borderColor: 'var(--theme-primary)' }}
            >
              <p className="text-center font-mono text-2xl font-bold break-all"
                 style={{ color: 'var(--theme-primary)' }}>
                {generatedQR.qrCode}
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Wygenerowano: {new Date(generatedQR.generatedAt).toLocaleString('pl-PL')}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="btn-secondary flex-1"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Kopiuj kod
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
              <p className="font-medium text-slate-900 dark:text-slate-100">Wygeneruj kod QR</p>
              <p>Utwórz unikalny kod QR dla każdej lokalizacji w Twojej firmie</p>
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
              <p className="font-medium text-slate-900 dark:text-slate-100">Wydrukuj i umieść</p>
              <p>Wydrukuj kod QR i umieść go w widocznym miejscu przy wejściu</p>
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
              <p className="font-medium text-slate-900 dark:text-slate-100">Pracownicy skanują</p>
              <p>Pracownicy skanują kod przy rozpoczęciu i zakończeniu pracy</p>
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
              <p className="font-medium text-slate-900 dark:text-slate-100">Automatyczne śledzenie</p>
              <p>System automatycznie rejestruje czas pracy i generuje raporty</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
