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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Raporty</h1>
        <p className="text-xs text-slate-500">
          Eksportuj dane pracowników do pliku CSV lub PDF.
        </p>
      </div>

      {!isAdmin && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Tylko administrator może generować raporty.
        </p>
      )}

      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
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
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200"
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
