import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleDownload = async (type) => {
    try {
      const response = await api.get(`/reports/employees/${type}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        type === 'csv' ? 'employees.csv' : 'employees.pdf'
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Nie udało się pobrać raportu');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="app-card p-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Raporty</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Eksportuj dane pracowników do pliku CSV lub PDF
            </p>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="app-card p-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            Tylko administrator może generować raporty.
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="app-card p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Raport pracowników (CSV)
            </h2>
            <p className="text-xs text-slate-500 mb-2">
              Zawiera listę pracowników wraz z podstawowymi danymi.
            </p>
            <button
              type="button"
              onClick={() => handleDownload('csv')}
              className="inline-flex items-center rounded-lg bg-theme-gradient px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-theme hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200"
            >
              Pobierz CSV
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Raport pracowników (PDF)
            </h2>
            <p className="text-xs text-slate-500 mb-2">
              Prosty raport tekstowy z listą pracowników w formacie PDF.
            </p>
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-600/30 hover:shadow-xl hover:shadow-pink-600/40 hover:scale-105 transition-all duration-200"
            >
              Pobierz PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
