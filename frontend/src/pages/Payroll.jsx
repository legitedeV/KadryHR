import React, { useState } from 'react';
import api from '../api/axios';

const Payroll = () => {
  const [form, setForm] = useState({
    hourlyRate: '',
    baseHours: '160',
    overtimeHours: '0',
    overtimeMultiplier: '1.5',
    bonus: '0',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/payroll/calculate', {
        hourlyRate: Number(form.hourlyRate || 0),
        baseHours: Number(form.baseHours || 0),
        overtimeHours: Number(form.overtimeHours || 0),
        overtimeMultiplier: Number(form.overtimeMultiplier || 1),
        bonus: Number(form.bonus || 0),
      });
      setResult(data);
    } catch (err) {
      setError('Błąd obliczania wynagrodzenia');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Kalkulator wynagrodzeń</h1>
        <p className="text-xs text-slate-500">
          Oblicz wynagrodzenie na podstawie stawki godzinowej, nadgodzin i premii.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            name="hourlyRate"
            placeholder="Stawka godzinowa (PLN)"
            type="number"
            value={form.hourlyRate}
            onChange={handleChange}
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            name="baseHours"
            placeholder="Godziny podstawowe / m-c"
            type="number"
            value={form.baseHours}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            name="overtimeHours"
            placeholder="Nadgodziny"
            type="number"
            value={form.overtimeHours}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            name="overtimeMultiplier"
            placeholder="Mnożnik nadgodzin"
            type="number"
            step="0.1"
            value={form.overtimeMultiplier}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            name="bonus"
            placeholder="Premia (PLN)"
            type="number"
            value={form.bonus}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700"
          >
            Oblicz wynagrodzenie
          </button>
        </form>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Wynik obliczeń
          </h2>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {!error && !result && (
            <p className="text-xs text-slate-500">
              Wprowadź dane i kliknij &quot;Oblicz wynagrodzenie&quot;.
            </p>
          )}
          {result && (
            <div className="space-y-1 text-xs text-slate-700">
              <div>Podstawa: <strong>{result.base} PLN</strong></div>
              <div>Nadgodziny: <strong>{result.overtime} PLN</strong></div>
              <div>Premia: <strong>{result.bonus} PLN</strong></div>
              <div className="mt-2">Brutto: <strong>{result.gross} PLN</strong></div>
              <div>Składki: <strong>{result.contributions} PLN</strong></div>
              <div>Podatek: <strong>{result.tax} PLN</strong></div>
              <div className="mt-2 text-sm">
                Netto: <strong>{result.net} PLN</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
