import React, { useState } from 'react';
import { calculatePayroll, validatePayrollInput } from '../utils/payrollCalculator';

const Payroll = () => {
  const [form, setForm] = useState({
    hourlyRate: '',
    baseHours: '160',
    overtimeHours: '0',
    overtimeMultiplier: '1.5',
    bonus: '0',
    contractType: 'employment',
    isStudent: false,
    hasDisability: false,
    customCosts: '0',
    taxDeduction: '0',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    const params = {
      hourlyRate: Number(form.hourlyRate || 0),
      baseHours: Number(form.baseHours || 0),
      overtimeHours: Number(form.overtimeHours || 0),
      overtimeMultiplier: Number(form.overtimeMultiplier || 1),
      bonus: Number(form.bonus || 0),
      contractType: form.contractType,
      isStudent: form.isStudent,
      hasDisability: form.hasDisability,
      customCosts: Number(form.customCosts || 0),
      taxDeduction: Number(form.taxDeduction || 0),
    };
    
    // Validate input
    const validation = validatePayrollInput(params);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    try {
      const calculatedResult = calculatePayroll(params);
      setResult(calculatedResult);
      
      // Add to history (keep last 3)
      const newEntry = {
        timestamp: new Date().toLocaleString('pl-PL'),
        params: { ...form },
        result: calculatedResult,
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 3));
    } catch (err) {
      setError('Błąd obliczania wynagrodzenia: ' + err.message);
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
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kalkulator wynagrodzeń</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Oblicz wynagrodzenie na podstawie stawki godzinowej, nadgodzin i premii
            </p>
          </div>
        </div>
      </div>

      {/* Main Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="app-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Parametry obliczeń
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Stawka godzinowa (PLN)
              </label>
              <input
                name="hourlyRate"
                placeholder="np. 25.50"
                type="number"
                step="0.01"
                value={form.hourlyRate}
                onChange={handleChange}
                required
                className="input-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Godziny podstawowe
                </label>
                <input
                  name="baseHours"
                  placeholder="160"
                  type="number"
                  value={form.baseHours}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nadgodziny
                </label>
                <input
                  name="overtimeHours"
                  placeholder="0"
                  type="number"
                  value={form.overtimeHours}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mnożnik nadgodzin
                </label>
                <input
                  name="overtimeMultiplier"
                  placeholder="1.5"
                  type="number"
                  step="0.1"
                  value={form.overtimeMultiplier}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Premia (PLN)
                </label>
                <input
                  name="bonus"
                  placeholder="0"
                  type="number"
                  step="0.01"
                  value={form.bonus}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>
            </div>

            {/* Typ umowy */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rodzaj umowy
              </label>
              <select
                name="contractType"
                value={form.contractType}
                onChange={handleChange}
                className="input-primary"
              >
                <option value="employment">Umowa o pracę</option>
                <option value="mandate">Umowa zlecenie</option>
                <option value="contract">Umowa o dzieło</option>
              </select>
            </div>

            {/* Checkboxy dla statusu */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isStudent"
                  checked={form.isStudent}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                  style={{ accentColor: 'var(--theme-primary)' }}
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Jestem studentem / uczniem poniżej 26 roku życia
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasDisability"
                  checked={form.hasDisability}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                  style={{ accentColor: 'var(--theme-primary)' }}
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Posiadam orzeczenie o niepełnosprawności
                </span>
              </label>
            </div>

            {/* Dodatkowe koszty i ulgi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dodatkowe koszty (PLN)
                </label>
                <input
                  name="customCosts"
                  placeholder="0"
                  type="number"
                  step="0.01"
                  value={form.customCosts}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ulga podatkowa (PLN)
                </label>
                <input
                  name="taxDeduction"
                  placeholder="0"
                  type="number"
                  step="0.01"
                  value={form.taxDeduction}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
            >
              Oblicz wynagrodzenie
            </button>
          </form>
        </div>

        {/* Right: Result */}
        <div className="app-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Wynik obliczeń
          </h2>
          
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          
          {!error && !result && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Wprowadź dane po lewej i kliknij<br />&quot;Oblicz wynagrodzenie&quot;
              </p>
            </div>
          )}
          
          {result && (
            <div className="space-y-4">
              {/* Main Result */}
              <div 
                className="rounded-xl p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.1), rgba(var(--theme-secondary-rgb), 0.05))`,
                  borderLeft: `4px solid var(--theme-primary)`
                }}
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Wynagrodzenie netto</p>
                <p 
                  className="text-4xl font-bold"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  {result.net} PLN
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Podstawa</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{result.base} PLN</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Nadgodziny</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{result.overtime} PLN</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Premia</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{result.bonus} PLN</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Brutto</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{result.gross} PLN</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Składki</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{result.contributions} PLN</span>
                </div>
                {result.breakdown?.costs && (
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Koszty uzyskania</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">-{result.breakdown.costs} PLN</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Podstawa opodatkowania</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{result.taxBase} PLN</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Podatek</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{result.tax} PLN</span>
                </div>
                {result.breakdown?.note && (
                  <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-400">{result.breakdown.note}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="app-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Historia obliczeń
          </h2>
          
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div 
                key={index}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{entry.timestamp}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {entry.params.hourlyRate} PLN/h × {entry.params.baseHours}h
                      {Number(entry.params.overtimeHours) > 0 && ` + ${entry.params.overtimeHours}h nadgodzin`}
                      {Number(entry.params.bonus) > 0 && ` + ${entry.params.bonus} PLN premii`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Netto</p>
                    <p 
                      className="text-lg font-bold"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      {entry.result.net} PLN
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
