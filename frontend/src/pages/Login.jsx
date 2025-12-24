import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-layout relative overflow-hidden px-4">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        background: `radial-gradient(circle at 20% 20%, rgba(var(--theme-primary-rgb),0.18), transparent 35%),
        radial-gradient(circle at 80% 0%, rgba(14,165,233,0.15), transparent 40%)`
      }} />
      <ThemeSwitcher />
      <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/80 rounded-3xl shadow-[0_22px_60px_-32px_rgba(15,23,42,0.7)] border border-slate-200/70 dark:border-slate-800/80 p-8 space-y-6 backdrop-blur-xl">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 items-center justify-center shadow-xl mx-auto">
            <span className="text-xl font-bold text-white">KH</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Logowanie</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Zaloguj się do panelu kadrowo-płacowego.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-slide-down">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
              placeholder="twoj@email.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hasło</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 text-white text-sm font-semibold py-3 shadow-lg shadow-slate-900/30 hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-60"
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rejestracja nowych kont odbywa się poprzez zaproszenie od administratora.
          </p>
          <Link to="/" className="text-sm font-semibold text-sky-600 dark:text-sky-300 inline-block">
            ← Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
