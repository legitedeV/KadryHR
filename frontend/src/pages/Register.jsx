import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const inviteEmail = searchParams.get('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const inviteMode = Boolean(inviteToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!inviteMode) {
      setError('Rejestracja możliwa tylko przez link z zaproszenia.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          inviteToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Błąd rejestracji. Spróbuj ponownie.');
      }

      login(data);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Błąd rejestracji. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-layout relative overflow-hidden px-4">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        background: `radial-gradient(circle at 22% 18%, rgba(var(--theme-primary-rgb),0.18), transparent 36%),
        radial-gradient(circle at 82% 0%, rgba(14,165,233,0.15), transparent 40%)`
      }} />
      <ThemeSwitcher />
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/85 rounded-3xl shadow-[0_22px_60px_-32px_rgba(15,23,42,0.7)] border border-slate-200/70 dark:border-slate-800/80 px-7 py-7 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Rejestracja</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Link aktywacyjny od administratora jest wymagany.</p>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(var(--theme-primary-rgb),0.12)', color: 'var(--theme-primary)' }}>
            Zaproszenie
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {inviteMode ? (
            <>
              Uzupełnij dane, aby dokończyć rejestrację z zaproszenia.
              <br />
              Link został wygenerowany przez administratora systemu.
            </>
          ) : (
            <>
              Rejestracja możliwa tylko przez zaproszenie od administratora.
              <br />
              Poproś administratora o wygenerowanie linku rejestracyjnego.
            </>
          )}
        </p>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Imię i nazwisko
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!inviteMode || submitting}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!inviteEmail || !inviteMode || submitting}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Hasło
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!inviteMode || submitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!inviteMode || submitting}
            className="mt-2 w-full inline-flex justify-center rounded-xl bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Rejestruję...' : 'Zarejestruj'}
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Masz już konto?{' '}
          <Link
            to="/login"
            className="text-sky-600 dark:text-sky-300 font-semibold hover:underline transition-colors duration-200"
          >
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
