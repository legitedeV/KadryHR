import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import api from '../api/axios';
import Alert from './Alert';

const QRGenerator = () => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, waiting, started, error
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (qrData) {
      generateQRCode(qrData.qrUrl);
      startCountdown(qrData.validitySeconds);
    }
  }, [qrData]);

  const generateToken = async () => {
    setLoading(true);
    setError(null);
    setStatus('waiting');

    try {
      const response = await api.post('/qr/generate-token', {
        validitySeconds: 120 // 2 minutes
      });

      setQrData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd generowania tokenu');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (url) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      await QRCode.toCanvas(canvas, url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const startCountdown = (seconds) => {
    setTimeRemaining(seconds);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setStatus('idle');
          setQrData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const refreshToken = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    generateToken();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Rozpocznij pracę przez QR kod
      </h2>

      {error && (
        <Alert type="error" message={error} className="mb-4" />
      )}

      {status === 'idle' && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Wygeneruj kod QR, aby rozpocząć pracę przez telefon
          </p>
          <button
            onClick={generateToken}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generowanie...' : 'Generuj kod QR'}
          </button>
        </div>
      )}

      {status === 'waiting' && qrData && (
        <div className="text-center">
          <div className="mb-4">
            <canvas
              ref={canvasRef}
              className="mx-auto border-2 border-gray-200 dark:border-gray-700 rounded-lg"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Kod wygasa za:
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatTime(timeRemaining)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zeskanuj kod telefonem, aby rozpocząć pracę
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Lub otwórz link na telefonie:
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 break-all text-xs font-mono">
              {qrData.qrUrl}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={refreshToken}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Odśwież kod
            </button>
            <button
              onClick={() => {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
                setStatus('idle');
                setQrData(null);
              }}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Jak to działa?
        </h3>
        <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
          <li>Wygeneruj kod QR na tym ekranie</li>
          <li>Zeskanuj kod telefonem lub otwórz link</li>
          <li>Zaloguj się (jeśli nie jesteś zalogowany)</li>
          <li>Praca zostanie automatycznie rozpoczęta</li>
        </ol>
      </div>
    </div>
  );
};

export default QRGenerator;
