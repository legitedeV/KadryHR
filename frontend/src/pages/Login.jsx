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
    <div className="min-h-screen flex items-center justify-center bg-page-light px-4">
      <ThemeSwitcher />
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-pink-100 dark:border-slate-700 p-8 space-y-6 animate-scale-in">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br bg-theme-gradient items-center justify-center shadow-lg shadow-theme mx-auto">
            <span className="text-xl font-bold text-white">KH</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Logowanie</h1>
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
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border-2 border-slate-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus-theme focus:border-theme-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-200"
              placeholder="twoj@email.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hasło</label>
            <input
              type="password"
              className="w-full rounded-lg border-2 border-slate-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus-theme focus:border-theme-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-theme-gradient text-white text-sm font-semibold py-3 shadow-lg shadow-theme hover:shadow-xl hover:shadow-pink-500/40 disabled:opacity-60 transition-all duration-200"
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rejestracja nowych kont odbywa się poprzez zaproszenie od administratora.
          </p>
          <Link to="/" className="text-sm font-medium text-theme-primary hover:text-theme-primary inline-block">
            ← Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
